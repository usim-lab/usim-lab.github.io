/* ================================================================
   NEEL Lab · AI assistant server (Cloudflare Worker)
   ----------------------------------------------------------------
   POST /           chat — streams Server-Sent Events in the Anthropic
                    Messages format (content_block_delta / message_delta),
                    plus {type:"status"} and {type:"sources"} events.
   POST /translate  batch KO⇄EN translation for sync/i18n.py (token-protected)
   GET  /           health check

   Provider:
     · default  — Workers AI (free daily allocation, no key): Qwen3 (ROUTER_MODEL)
                  decides whether the question needs the web and writes the
                  keywords, the Worker searches Wikipedia / OpenAlex→Crossref /
                  DuckDuckGo (+ Tavily / Naver when keys are set), and Llama 3.3 70B
                  (CF_MODEL) answers from the site data + results.
     · ANTHROPIC_API_KEY secret set — Claude answers and searches the web
                  itself with the server-side web search tool.
   The system prompt is fixed here, so the endpoint can't be used as a
   general-purpose chatbot; the browser only sends the conversation.
   ================================================================ */
import Anthropic from "@anthropic-ai/sdk";

const UA = "NEEL-Lab-Assistant/1.0 (+https://usim-lab.github.io)";
const HANGUL = /[가-힣]/;
const STOPWORDS = new Set(["the", "and", "for", "with", "what", "how", "recent", "latest", "trends", "trend", "research", "최근", "연구", "동향", "방법", "원리"]);

const systemPrompt = (email) =>
  `You are the friendly assistant of the NEEL Lab website (Nanomaterials for Energy & Environment Laboratory, Prof. Uk Sim, SKKU SAINT, Korea).
Ground answers about the lab (people, papers, patents, awards, projects, news, contact) strictly in the <site_data> block of the user's message: state only facts written there, and never invent papers, DOIs, numbers, names, roles, projects or links. If a detail (e.g. a DOI or a year) is not in the data, leave it out.
Do not guess anyone's gender: refer to people by name or role, or use "they".
For general or outside knowledge you may use the <web_results> block when it is present — cite those sources inline as markdown links. If neither source covers the question, say so briefly and point to the relevant page of the site or the email ${email}.
Reply in the language of the question (Korean or English); Korean answers use Hangul (plus English technical terms) only — never Chinese characters or Japanese. Be concise and well formatted: short paragraphs, bullet lists for several items, bold for key names. When you cite a paper give its title, journal, year and DOI/PDF link as a markdown link.`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method === "GET") return json({ ok: true, provider: env.ANTHROPIC_API_KEY ? "claude" : "workers-ai", model: env.ANTHROPIC_API_KEY ? env.CLAUDE_MODEL : env.CF_MODEL }, 200, cors);
    if (request.method !== "POST") return json({ error: { message: "POST only" } }, 405, cors);

    if (url.pathname === "/translate") {
      if (!env.I18N_TOKEN || request.headers.get("X-I18N-Token") !== env.I18N_TOKEN) return json({ error: { message: "unauthorized" } }, 401, cors);
      return translate(request, env, cors);
    }

    if (!allowed.includes(origin)) return json({ error: { message: "origin not allowed" } }, 403, cors);
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "anon" });
      if (!success) return json({ error: { message: "Too many questions — please wait a minute." } }, 429, cors);
    }
    let body;
    try { body = await request.json(); } catch (e) { return json({ error: { message: "bad json" } }, 400, cors); }
    const messages = cleanMessages(body.messages);
    if (!messages) return json({ error: { message: "messages must alternate user/assistant and end with a user turn" } }, 400, cors);
    const system = systemPrompt(env.LAB_EMAIL || "usim@skku.edu");
    try {
      if (env.ANTHROPIC_API_KEY) return await viaClaude(env, system, messages, cors);
      // admins (I18N_TOKEN) may try another Workers AI model for comparison
      const override = env.I18N_TOKEN && request.headers.get("X-I18N-Token") === env.I18N_TOKEN && typeof body.model === "string" && body.model.startsWith("@cf/") ? body.model : null;
      return await viaWorkersAI(env, ctx, system, messages, cors, override);
    } catch (e) {
      const status = /quota|limit|exceed|429/i.test(String(e && e.message)) ? 429 : 502;
      return json({ error: { message: String((e && e.message) || e) } }, status, cors);
    }
  },
};

/* ---------------- helpers ---------------- */
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
const sse = (obj) => `event: ${obj.type}\ndata: ${JSON.stringify(obj)}\n\n`;

function cleanMessages(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const out = list.slice(-12).map((m) => ({ role: m && m.role, content: typeof (m && m.content) === "string" ? m.content.slice(0, 40000) : "" }));
  if (out[0].role !== "user") out.shift();
  for (let i = 0; i < out.length; i++) if (out[i].role !== (i % 2 ? "assistant" : "user") || !out[i].content) return null;
  return out.length && out[out.length - 1].role === "user" ? out : null;
}
// the browser wraps the question as "<site_data>…</site_data>\n\nQuestion: …"
const questionOf = (text) => { const i = text.lastIndexOf("Question:"); return (i >= 0 ? text.slice(i + 9) : text).trim().slice(0, 500); };

async function withTimeout(promise, ms) {
  let t; const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timeout")), ms); });
  try { return await Promise.race([promise, timeout]); } finally { clearTimeout(t); }
}
async function getJSON(u, init) {
  const r = await withTimeout(fetch(u, { ...init, headers: { "User-Agent": UA, Accept: "application/json", ...((init && init.headers) || {}) } }), 5000);
  if (!r.ok) throw new Error(u + " → " + r.status);
  return r.json();
}
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

/* ---------------- Claude (paid, optional) ---------------- */
async function viaClaude(env, system, messages, cors) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const res = await client.beta.messages.create({
    model: env.CLAUDE_MODEL || "claude-opus-5-5",
    max_tokens: 4096,
    system,
    messages,
    stream: true,
    output_config: { effort: "low" },
    cache_control: { type: "ephemeral" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    fallbacks: "default",
    betas: ["server-side-fallback-2026-07-01"],
  }).asResponse();
  return new Response(res.body, { status: res.status, headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

/* ---------------- Workers AI (free) ---------------- */
function textOf(out) {
  if (out == null) return "";
  if (typeof out === "string") return out;
  if (typeof out.response === "string") return out.response;
  if (out.response && typeof out.response === "object") return JSON.stringify(out.response);
  const c = out.choices && out.choices[0];
  return (c && ((c.message && c.message.content) || c.text)) || "";
}
const noThink = (model, s) => (/qwen3/i.test(model) ? s + "\n/no_think" : s);
const dropThink = (s) => s.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^[\s\S]*<\/think>/, "").trim();

async function decideSearch(env, model, messages) {
  const q = questionOf(messages[messages.length - 1].content);
  const prev = messages.length > 1 ? messages[messages.length - 2].content.slice(0, 400) : "";
  const sys = noThink(model, `You route questions for a university lab website assistant. The assistant already has the lab's own data (members, papers, patents, awards, projects, news, research topics, contact, how to apply).
Decide whether a web search would help. Search ONLY for general knowledge outside the lab: scientific concepts and definitions, other institutions or people, recent events, comparisons. Do NOT search for anything about the lab, Prof. Uk Sim, its members, papers, cover articles, patents, awards, projects, news, courses, recruitment or contact, nor for greetings or small talk.
Examples: "표지 논문은 몇 편이야?" → {"search": false} · "정경화 박사님 연구 분야는?" → {"search": false} · "대학원 지원 방법" → {"search": false} · "How many papers in 2025?" → {"search": false} · "수전해가 뭐야?" → {"search": true, "query": "수전해 원리", "query_en": "water electrolysis"} · "What is the Haber-Bosch process?" → {"search": true, "query": "Haber-Bosch process", "query_en": "Haber-Bosch process"}
Answer with JSON only: {"search": true|false, "query": "<2-6 search keywords in the question's language>", "query_en": "<the same 2-6 keywords in English>"}`);
  const out = await withTimeout(env.AI.run(model, { messages: [{ role: "system", content: sys }, { role: "user", content: (prev ? "Previous answer (context): " + prev + "\n\n" : "") + "Question: " + q }], max_tokens: 120, temperature: 0 }), 8000);
  const m = dropThink(textOf(out)).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    if (!j || !j.search || !(j.query || j.query_en)) return null;
    const query = String(j.query || j.query_en).slice(0, 200);
    return { query, en: String(j.query_en || (HANGUL.test(query) ? "" : query)).slice(0, 200) };
  } catch (e) { return null; }
}

async function searchWeb(env, q) {
  const query = q.query, en = q.en || q.query;
  const ko = HANGUL.test(query);
  const tasks = [];
  const wiki = async (lang, term) => {
    const s = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=2&format=json&utf8=1&srprop=snippet`);
    return (s.query && s.query.search || []).map((x) => ({ title: `${x.title} — Wikipedia`, url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(x.title.replace(/ /g, "_"))}`, snippet: strip(x.snippet) }));
  };
  if (ko) tasks.push(wiki("ko", query));
  if (en && !HANGUL.test(en)) tasks.push(wiki("en", en));
  // scholarly literature: OpenAlex, falling back to Crossref (OpenAlex rate-limits shared egress IPs)
  const crossref = async () => {
    const s = await getJSON(`https://api.crossref.org/works?query=${encodeURIComponent(en)}&rows=3&select=title,DOI,issued,container-title,abstract&mailto=${encodeURIComponent(env.LAB_EMAIL || "usim@skku.edu")}`);
    return ((s.message && s.message.items) || []).filter((w) => w.title && w.title[0]).map((w) => ({
      title: `${w.title[0]} (${(w["container-title"] || [])[0] ? w["container-title"][0] + ", " : ""}${(w.issued && w.issued["date-parts"] && w.issued["date-parts"][0][0]) || ""})`,
      url: `https://doi.org/${w.DOI}`, snippet: strip(w.abstract || "").slice(0, 350) }));
  };
  tasks.push((async () => {
    let s;
    try { s = await getJSON(`https://api.openalex.org/works?search=${encodeURIComponent(en)}&per-page=3&select=title,publication_year,doi,id,primary_location,abstract_inverted_index&mailto=${encodeURIComponent(env.LAB_EMAIL || "usim@skku.edu")}`); } catch (e) { return crossref(); }
    return (s.results || []).map((w) => {
      let abs = "";
      if (w.abstract_inverted_index) { const pos = []; for (const [word, idx] of Object.entries(w.abstract_inverted_index)) idx.forEach((i) => { pos[i] = word; }); abs = pos.filter(Boolean).join(" ").slice(0, 350); }
      const venue = w.primary_location && w.primary_location.source && w.primary_location.source.display_name;
      return { title: `${w.title} (${venue ? venue + ", " : ""}${w.publication_year || ""})`, url: w.doi || w.id, snippet: abs };
    });
  })());
  tasks.push((async () => {
    const s = await getJSON(`https://api.duckduckgo.com/?q=${encodeURIComponent(en)}&format=json&no_html=1&skip_disambig=1&t=neel-lab`);
    const out = [];
    if (s.AbstractText) out.push({ title: s.Heading || en, url: s.AbstractURL, snippet: s.AbstractText.slice(0, 400) });
    (s.RelatedTopics || []).filter((x) => x.FirstURL && x.Text).slice(0, 2).forEach((x) => out.push({ title: x.Text.split(" - ")[0].slice(0, 80), url: x.FirstURL, snippet: x.Text.slice(0, 250) }));
    return out;
  })());
  if (env.TAVILY_API_KEY) tasks.push((async () => {
    const s = await getJSON("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.TAVILY_API_KEY}` }, body: JSON.stringify({ query, max_results: 5, search_depth: "basic" }) });
    return (s.results || []).map((x) => ({ title: x.title, url: x.url, snippet: String(x.content || "").slice(0, 400) }));
  })());
  if (env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET) {
    const nh = { "X-Naver-Client-Id": env.NAVER_CLIENT_ID, "X-Naver-Client-Secret": env.NAVER_CLIENT_SECRET };
    for (const kind of ["news", "webkr"]) tasks.push((async () => {
      const s = await getJSON(`https://openapi.naver.com/v1/search/${kind}.json?query=${encodeURIComponent(query)}&display=3`, { headers: nh });
      return (s.items || []).map((x) => ({ title: strip(x.title), url: x.originallink || x.link, snippet: strip(x.description).slice(0, 300) }));
    })());
  }
  const settled = await Promise.allSettled(tasks);
  settled.forEach((r) => { if (r.status === "rejected") console.log("search provider failed:", String((r.reason && r.reason.message) || r.reason)); });
  // keep only results that share a keyword with the query
  const keys = `${query} ${en}`.toLowerCase().split(/[^a-z0-9가-힣]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)).map((w) => (HANGUL.test(w) ? w.slice(0, 2) : w.slice(0, 5)));
  const relevant = (x) => { const h = `${x.title} ${x.snippet}`.toLowerCase(); return !keys.length || keys.some((k) => h.includes(k)); };
  const seen = new Set(), results = [];
  for (const r of settled) if (r.status === "fulfilled") for (const x of r.value) if (x.url && !seen.has(x.url) && relevant(x)) { seen.add(x.url); results.push(x); }
  // paid/keyed general web results first, then encyclopedia + literature
  return results.slice(0, 6);
}

// strip <think>…</think> spans from a token stream (tags may be split across chunks)
function thinkFilter() {
  let inThink = false, buf = "", started = false;
  return (chunk, flush) => {
    buf += chunk; let out = "";
    while (buf) {
      if (inThink) { const e = buf.indexOf("</think>"); if (e < 0) { buf = flush ? "" : buf.slice(-8); break; } buf = buf.slice(e + 8); inThink = false; continue; }
      const s = buf.indexOf("<think>");
      if (s >= 0) { out += buf.slice(0, s); buf = buf.slice(s + 7); inThink = true; continue; }
      const keep = flush ? 0 : Math.min(buf.length, 7);
      out += buf.slice(0, buf.length - keep); buf = buf.slice(buf.length - keep);
      break;
    }
    if (!started) { out = out.replace(/^\s+/, ""); if (out) started = true; }
    return out;
  };
}

async function viaWorkersAI(env, ctx, system, messages, cors, modelOverride) {
  const model = modelOverride || env.CF_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const enc = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const send = (obj) => w.write(enc.encode(sse(obj)));

  const run = async () => {
    try {
      await send({ type: "message_start", message: { model, provider: "workers-ai" } });
      const q = questionOf(messages[messages.length - 1].content);
      let plan = null, results = [];
      try { plan = await decideSearch(env, env.ROUTER_MODEL || model, messages); } catch (e) { plan = null; }
      const query = plan && plan.query;
      if (plan) {
        await send({ type: "status", text: (HANGUL.test(q) ? "🔎 웹 검색: " : "🔎 Searching the web: ") + query });
        results = await searchWeb(env, plan);
        if (results.length) await send({ type: "sources", items: results.map((r) => ({ title: r.title, url: r.url })) });
      }
      const last = messages[messages.length - 1];
      const web = results.length ? `\n\n<web_results query="${query.replace(/"/g, "'")}">\n${results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n")}\n</web_results>` : "";
      const msgs = [{ role: "system", content: noThink(model, system) }, ...messages.slice(0, -1), { role: "user", content: last.content + web }];
      const stream = await env.AI.run(model, { messages: msgs, stream: true, max_tokens: 1400, temperature: 0.2 });
      await send({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
      const filter = thinkFilter();
      const reader = stream.getReader(); const dec = new TextDecoder(); let buf = "";
      const emit = async (s) => { if (s) await send({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: s } }); };
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim(); if (!data || data === "[DONE]") continue;
          let j; try { j = JSON.parse(data); } catch (e) { continue; }
          const c = j.choices && j.choices[0];
          const piece = typeof j.response === "string" ? j.response : (c && c.delta && c.delta.content) || "";
          await emit(filter(piece || "", false));
        }
      }
      await emit(filter("", true));
      await send({ type: "content_block_stop", index: 0 });
      await send({ type: "message_delta", delta: { stop_reason: "end_turn" } });
      await send({ type: "message_stop" });
    } catch (e) {
      await send({ type: "error", error: { type: "api_error", message: String((e && e.message) || e) } });
    } finally {
      await w.close();
    }
  };
  ctx.waitUntil(run());
  return new Response(readable, { headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

/* ---------------- /translate (used by sync/i18n.py in GitHub Actions) ---------------- */
async function translate(request, env, cors) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: { message: "bad json" } }, 400, cors); }
  const target = body.target === "ko" ? "Korean" : "English";
  const source = target === "English" ? "Korean" : "English";
  const model = env.CF_MODEL || "@cf/qwen/qwen3-30b-a3b-fp8";
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 20);
  const sys = noThink(model, `Translate ${source} text from a university research lab website (NEEL Lab, Prof. Uk Sim, SKKU) into natural, professional ${target}.
Rules: keep every HTML tag, attribute and entity exactly as in the input and only translate the text between tags; keep numbers, dates, DOIs, grant/patent numbers, journal names and chemical formulas unchanged; romanize Korean personal names with the given name first (e.g. 정경화 → Gyoung Hwa Jeong); "교수" after a name → "Prof." before it. Output only the translation, nothing else.`);
  const out = [];
  for (let i = 0; i < items.length; i += 4) {
    const part = items.slice(i, i + 4);
    const res = await Promise.all(part.map(async (it) => {
      try {
        const r = await env.AI.run(model, { messages: [{ role: "system", content: sys }, { role: "user", content: String(it.text || "") }], max_tokens: 2048, temperature: 0.1 });
        return { id: it.id, text: dropThink(textOf(r)) };
      } catch (e) { return { id: it.id, text: "" }; }
    }));
    out.push(...res);
  }
  return json({ items: out }, 200, cors);
}
