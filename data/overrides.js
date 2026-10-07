/* ================================================================
   NEEL Lab website · 사이트 문구 설정 (직접 편집 가능)
   ----------------------------------------------------------------
   구글 사이트에 없는 "디자인용 문구"만 여기서 관리합니다.
   (연구실 데이터 — 논문·구성원·수상 등 — 는 구글 사이트를 고친 뒤
    sync/sync_site.py 를 실행하면 data/content.js 로 자동 반영됩니다.)
   홈페이지 맨 아래 ✎ 버튼(비밀번호: neel)으로도 이 값을 편집하고
   파일로 저장할 수 있습니다.
   ai.endpoint = 방문자용 AI 서버(deploy/ai-worker, Cloudflare 무료 Qwen).
   ================================================================ */
window.NEEL_OVERRIDES = {
  "brand": { "name": "NEEL Lab", "full": "Nanomaterials for Energy & Environment Laboratory", "org": "SKKU SAINT" },
  "hero": {
    "chip_ko": "연구원 · 석박사 대학원생 모집 중",
    "chip_en": "Now recruiting · Researchers / M.S. / Ph.D.",
    "line1_ko": "나노가",
    "line1_en": "Nano meets",
    "line2_ko": "수소를 만나다.",
    "line2_en": "Hydrogen.",
    "tagline_ko": "청정 그린 수소와 고부가가치 화학물질 생산을 위한<br>나노소재 · 전기촉매 · 시스템 연구실",
    "tagline_en": "Nanomaterials · electrocatalysts · systems<br>for green hydrogen and value-added chemistry."
  },
  "philosophy": {
    "kicker": "Our Philosophy",
    "title1_ko": "하나의 원자 위에서,",
    "title2_ko": "세상을 바꾸는 반응이 일어납니다.",
    "title1_en": "On a single atom,",
    "title2_en": "a world-changing reaction begins.",
    "body_ko": "NEEL Lab은 에너지의 생산 · 변환 · 저장을 위한 나노소재와, 광·전기화학 반응으로 만드는 재생에너지를 연구합니다. 전극과 촉매 표면, 그리고 전극-전해질 계면에서 일어나는 반응의 메커니즘을 원자 수준에서 규명하고, 이를 바탕으로 다음 세대의 지속 가능한 에너지 시스템을 설계합니다."
  },
  "contact": {
    "email": "usim@skku.edu",
    "affiliation_ko": "성균관대학교 나노과학기술원 (SAINT)",
    "affiliation_en": "SKKU Advanced Institute of Nano Technology (SAINT), Sungkyunkwan University",
    "address_ko": "경기도 수원시 장안구 서부로 2066 성균관대학교 자연과학캠퍼스",
    "address_en": "2066 Seobu-ro, Jangan-gu, Suwon, Gyeonggi-do 16419, Republic of Korea",
    "google_site": "https://sites.google.com/view/uksim",
    "saint": "https://saint.skku.edu"
  },
  "professor": {
    "title_ko": "부교수",
    "affiliation_ko": "성균관대학교 나노과학기술원(SAINT)",
    "bio_ko": [
      "심욱 교수는 성균관대학교(SKKU) 나노과학기술원(SAINT) 부교수입니다. 서울대학교 재료공학부에서 학사(2007), 석사(2009), 박사(2016) 학위를 받았습니다.",
      "성균관대학교에 부임하기 전에는 한국에너지공과대학교(KENTECH, 2022–2026)와 전남대학교(2017–2022)에서 부교수로 재직했으며, 삼성전기 책임연구원과 스탠퍼드대학교 박사후연구원을 지냈습니다.",
      "또한 2020년부터 (주)닐사이언스(NEEL Sciences)의 창업자이자 대표이사로 활동하고 있습니다. 연구는 에너지의 생산·변환·저장을 위한 나노소재 개발에 초점을 두며, 특히 지속 가능한 미래를 위한 광·전기화학 반응 기반 재생에너지 시스템을 연구합니다."
    ]
  },
  "research_en": {
      "Green Hydrogen Production Reaction and System Research": {
          "desc": "We develop nanostructured electrocatalysts and high-efficiency electrochemical systems for clean hydrogen production and the conversion of value-added chemicals.",
          "bullets": [
              "High-efficiency water-electrolysis catalysts and electrolyzer systems for green hydrogen",
              "Highly selective, durable seawater-electrolysis catalysts for the direct use of seawater",
              "Electrochemical CO₂ reduction (CO₂RR) for greenhouse-gas mitigation and value-added chemicals",
              "High-efficiency fuel cells converting the chemical energy of H₂ and O₂ into electricity"
          ]
      },
      "Electrochemical Energy Storage": {
          "desc": "We study electrode materials and systems for next-generation energy-storage devices with high power, high energy density and long cycle life.",
          "bullets": [
              "Design of high-efficiency electrode materials and electrode architectures",
              "Performance and lifetime improvement of supercapacitors and hybrid capacitors",
              "Elucidating charge storage and transfer mechanisms at the electrode–electrolyte interface",
              "Development of high-performance energy-storage devices and systems"
          ]
      },
      "Electrochemical Ammonia/Urea Production": {
          "desc": "We develop catalysts and systems for electrochemical ammonia and urea production, turning nitrogen-based pollutants into green chemicals.",
          "bullets": [
              "Ammonia production via electrochemical reduction of N₂ and nitrogen oxides such as nitrate (NRR, NO₃RR)",
              "Removal of nitrate pollutants and their conversion into value-added ammonia",
              "Low-cost, high-efficiency catalysts and large-area electrolyzer systems for commercialization",
              "Mechanistic understanding of electrochemical ammonia/urea synthesis"
          ]
      },
      "DFT- and Multiscale Modeling-Guided Catalyst Design": {
          "desc": "Using computational modeling we predict the activity and selectivity of catalysts for target electrochemical reactions and design them efficiently, linking experimental and computational data to identify intermediates, pathways and mechanisms.",
          "bullets": [
              "Catalyst screening and performance prediction with heuristics and machine learning",
              "Evaluation of catalytic activity and selectivity by density functional theory (DFT)",
              "Elucidation of electrochemical reaction mechanisms by combining experiment and computation"
          ]
      },
      "Ammonia/Urea Oxidation Reaction for Green Hydrogen Production": {
          "desc": "We study electrochemical ammonia- and urea-oxidation catalysts and electrolysis systems for carbon-free, low-energy hydrogen production.",
          "bullets": [
              "Highly selective and active ammonia/urea oxidation (AOR/UOR) catalysts",
              "Improved long-term stability and durability of catalysts",
              "Mechanistic understanding of electrochemical AOR/UOR",
              "Ammonia/urea electrolyzer systems for efficient hydrogen production"
          ]
      },
      "Development of Next-generation Aqueous Batteries": {
          "desc": "We develop electrode materials and systems for eco-friendly, stably operating transition-metal-based aqueous secondary batteries.",
          "bullets": [
              "High-efficiency electrodes and catalysts for high-performance aqueous batteries",
              "Long-life aqueous battery systems through improved catalyst selectivity",
              "Protective-layer materials for anode stabilization and dendrite suppression"
          ]
      },
      "High-efficiency Photoelectrocatalyst Design & Driving Mechanism and Application Research": {
          "desc": "We study high-efficiency photoelectrocatalysts and photoelectrochemical systems that use solar energy to produce green fuels and value-added chemicals.",
          "bullets": [
              "Mechanisms linking light absorption, charge separation and surface reactions",
              "Catalysts for ammonia production via photoelectrochemical nitrogen reduction (PEC NRR)",
              "Upconversion nanoparticles to boost light utilization and catalytic activity",
              "High-efficiency, stable photoelectrodes and photoelectrochemical systems"
          ]
      },
      "Development of Ultrastable Quantum Dots toward Moisture and Heat": {
          "desc": "We develop quantum dots that are exceptionally stable against moisture and heat, with excellent physicochemical properties, and apply them across fields.",
          "bullets": [
              "Additives for battery electrolytes",
              "Materials that enhance electrochemical CO₂ reduction efficiency",
              "Display materials that maximize color reproduction",
              "Solid electrolytes for metal–air batteries",
              "Sensors for detecting moisture and heat"
          ]
      },
      "Synthesis of quantum Dots using Nano Porous Materials and Application Research": {
          "desc": "Synthesis of quantum dots using nanoporous host materials and research on their applications.",
          "bullets": []
      },
      "Research of high performance nanogap impedimetric sensor": {
          "desc": "By minimizing signal loss during electrical sensing, we detect and identify subtle changes and intrinsic signatures within samples with high sensitivity.",
          "bullets": [
              "Simulation-guided design and fabrication of high-performance 2D/3D nanogap sensors",
              "Detection of pathogens and ion changes caused by external stimuli in specimens",
              "Impedance-based classification parameters for pathogens"
          ]
      }
  },
  "ai": {
    "endpoint": "https://usim-ai.usim-ai.workers.dev",
    "model": "claude-opus-5-5"
  },
  "editor_password": "neel"
};
