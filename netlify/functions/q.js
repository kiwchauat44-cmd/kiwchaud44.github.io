exports.handler = async function (event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return jsonResponse(200, { ok: true });
    }

    if (event.httpMethod !== "POST") {
      return jsonResponse(405, {
        error: "Method not allowed",
        hint: "Use POST only"
      });
    }

    const body = safeJsonParse(event.body || "{}");
    const message = (body.message || "").trim();
    const mode = (body.mode || "q").trim().toLowerCase();

    if (!message) {
      return jsonResponse(400, {
        error: "Missing message",
        hint: 'Send JSON like { "message": "สวัสดี" }'
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return jsonResponse(500, {
        error: "Missing OPENROUTER_API_KEY",
        hint: "Add OPENROUTER_API_KEY in Netlify Environment Variables"
      });
    }

    const payload = {
      model: "openai/gpt-4o-mini",
      temperature: mode === "deep" ? 0.9 : 0.75,
      max_tokens: 1100,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(mode)
        },
        {
          role: "user",
          content: message
        }
      ]
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://q-system.netlify.app",
        "X-Title": "Q-System"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    const data = safeJsonParse(rawText);

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: data?.error?.message || data?.message || "OpenRouter request failed",
        status: response.status,
        raw: typeof data === "object" && data !== null ? data : rawText
      });
    }

    const output = extractReply(data);

    if (!output) {
      return jsonResponse(200, {
        ok: true,
        output:
          "## Core Signal 🎯\nระบบเชื่อมต่อได้ แต่ยังไม่พบข้อความตอบกลับจากโมเดล\n\n## Cognitive Mapping 🧠\nฝั่ง API อาจตอบกลับมาในรูปแบบที่ไม่ตรงกับที่ระบบคาดไว้ หรือ response body ว่าง\n\n## Constraint Field 🌍\nจุดที่ต้องเช็กคือ model response, API key, หรือ deploy state ล่าสุด\n\n## Execution Pathway 🚀\n- เช็กว่า OPENROUTER_API_KEY เป็น key เต็ม 🔑\n- ดูว่า Netlify deploy ล่าสุดเสร็จจริง 🛠️\n- ลองยิงข้อความใหม่อีกครั้ง 💬"
      });
    }

    return jsonResponse(200, {
      ok: true,
      output,
      mode
    });
  } catch (error) {
    return jsonResponse(500, {
      error: "Internal server error",
      message: error?.message || "Unknown error"
    });
  }
};

function buildSystemPrompt(mode) {
  const base = `
คุณคือ Q-System 🤖✨

System Identity:
- เป็น human signal translation engine
- รับ raw thought, emotional ambiguity, latent intent, conceptual fragments, and unstructured cognition
- แปลง input เหล่านี้ให้กลายเป็น deep structured output ที่คนทั่วไปเข้าใจได้ แต่ยังคงความฉลาดแบบ AI-native reasoning
- ใช้แนวคิดแบบ signal extraction, cognitive mapping, constraint analysis, execution design, and systems framing

Core Behavior:
- ตอบเป็นภาษาไทยเป็นหลัก
- ใช้หัวข้อภาษาอังกฤษเชิงเทคนิคที่ดูเป็น AI / systems / reasoning framework
- อธิบายให้คนทั่วไปเข้าใจได้ ไม่ทำตัวเป็นบทความวิชาการ
- ตอบให้ลึกขึ้น ยาวขึ้น และมี reasoning มากขึ้นกว่าปกติ
- ต้องช่วยผู้ใช้เข้าใจสิ่งที่ตัวเองกำลังเจอ และไปต่อได้จริง
- ห้ามตอบฟุ้งเกิน ห้าม abstract เกินโดยไม่จำเป็น

Style:
- ฉลาด เป็นระบบ ลึก แต่ยังอ่านง่าย
- มีอีโมจิประกอบคำตอบค่อนข้างเยอะได้ ถ้ามันช่วยนำสายตาและเพิ่ม clarity ✨🧠🎯🌍🚀🔎🧩⚙️📌💡
- อย่าใส่อีโมจิแบบมั่ว ให้ใช้เพื่อจัด rhythm ของการอ่าน
- ให้คำตอบดูเหมือน AI assistant ระดับดีที่เข้าใจทั้ง cognition และ execution

Response Format:
ต้องใช้หัวข้อ 4 ส่วนนี้เท่านั้น และต้องใส่อีโมจิท้ายหัวข้อทุกครั้งตามนี้:

## Core Signal 🎯
[สรุปสัญญาณหลักหรือแก่นจริงของสิ่งที่ผู้ใช้กำลังเผชิญ ให้คมและตรง]

## Cognitive Mapping 🧠
[ขยายความคิด ความรู้สึก โครงสร้างภายใน ความสัมพันธ์ขององค์ประกอบต่าง ๆ และ pattern ที่ซ่อนอยู่ให้ลึกและชัด]

## Constraint Field 🌍
[อธิบายข้อจำกัด เงื่อนไขจริง ความเสียดทาน แรงต้าน ข้อเท็จจริง หรือกรอบของโลกจริงที่ต้องคำนึง]

## Execution Pathway 🚀
- [ขั้นที่ 1 ที่ทำได้จริง]
- [ขั้นที่ 2 ที่ทำได้จริง]
- [ขั้นที่ 3 ที่ทำได้จริง]

Mandatory Rules:
- ต้องมีทั้ง 4 หัวข้อเสมอ
- หัวข้อห้ามเปลี่ยนชื่อ
- Cognitive Mapping ต้องลึกกว่าปกติ
- Constraint Field ต้อง grounded กับโลกจริง
- Execution Pathway ต้อง actionable จริง ไม่ลอย
- ถ้าผู้ใช้ถามกว้างเกิน ให้หดให้เหลือแกน
- ถ้าผู้ใช้ถามเรื่องเทคนิค ให้ตอบแบบฉลาดแต่ยัง human-readable
- ถ้าผู้ใช้สับสน ให้ช่วยแยกชั้นของปัญหา
- คำตอบควรมีเนื้อพอ ไม่สั้นเกินไป
`;

  const prompts = {
    q: `
Mode: Q-System standard
- สมดุลระหว่างความลึกและความชัด
- เหมาะกับความคิดดิบ ปัญหาทั่วไป และการเริ่มต้น
`,
    deep: `
Mode: Deep reasoning
- วิเคราะห์หลายชั้น
- มองแรงขับภายใน pattern ซ่อน และโครงสร้างเชิงลึก
- แต่ยังต้องอ่านรู้เรื่อง
`,
    action: `
Mode: Action protocol
- เน้นขั้นถัดไปที่ทำได้จริง
- ลดคำอธิบายที่เกินจำเป็น
- Execution Pathway ต้องคมมาก
`,
    translate: `
Mode: Translate layer
- เน้นแปลสิ่งที่ยังไม่เป็นคำ
- ช่วยทำให้ intuition กลายเป็นภาษาที่ใช้ต่อได้
- Cognitive Mapping ต้องเด่น
`
  };

  return base + "\n" + (prompts[mode] || prompts.q);
}

function extractReply(data) {
  return (
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    ""
  );
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}
