/* ================================================================
   NEEL Lab · AI 어시스턴트 프록시 (Cloudflare Worker)
   ----------------------------------------------------------------
   방문자 브라우저에 API 키를 노출하지 않고 홈페이지의 AI 어시스턴트를
   모두에게 열어 주는 작은 서버입니다.  (무료 플랜으로 충분)

   설치 (5분):
     1. https://dash.cloudflare.com → Workers & Pages → Create Worker
     2. 이 파일 내용을 붙여넣고 Deploy
     3. Settings → Variables → Secret 추가:  ANTHROPIC_API_KEY = sk-ant-...
        (선택) ALLOWED_ORIGIN = https://your-domain.com   ← 비워두면 모든 출처 허용
     4. 워커 주소(https://xxx.workers.dev)를 data/overrides.js 의 ai.endpoint 에 적기
   ================================================================ */
const ALLOWED_MODELS = ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return new Response("POST only", { status: 405, headers: cors });
    if (!env.ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY secret is not set" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });

    let body;
    try { body = await request.json(); } catch (e) { return new Response("bad json", { status: 400, headers: cors }); }
    if (!ALLOWED_MODELS.includes(body.model)) body.model = "claude-opus-5";
    body.max_tokens = Math.min(body.max_tokens || 4096, 8192);
    body.fallbacks = "default";

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "server-side-fallback-2026-07-01",
      },
      body: JSON.stringify(body),
    });
    const headers = new Headers(cors);
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
