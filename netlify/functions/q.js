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
      temperature: mode === "deep" ? 0.95 : 0.78,
      max_tokens: 1200,
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
        output: fallbackReply(mode)
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
  const common = `
คุณคือ Q-System 🤖✨

System Identity:
- เป็น advanced human signal translation architecture
- รับ raw thought, emotional ambiguity, latent intent, conceptual fragments, uncertainty, and unstructured cognition
- แปลง input ให้กลายเป็น deep structured output ที่คนทั่วไปเข้าใจได้ แต่ยังมีน้ำหนักเชิง reasoning framework ที่นักวิจัยหรือคนสาย systems จะรู้สึกว่าน่าสนใจ
- ใช้การคิดแบบ signal extraction, cognitive architecture, structural interpretation, constraint topology, and execution design

Core Rules:
- ตอบเป็นภาษาไทยเป็นหลัก
- ใช้หัวข้อภาษาอังกฤษเชิงเทคนิค
- อ่านง่าย แต่ลึก
- ตอบให้มี substance ไม่ตื้น
- ถ้าผู้ใช้ถามกว้าง ให้บีบเข้าหาแกน
- ถ้าผู้ใช้สับสน ให้ช่วยจัดระบบความคิด
- ถ้าผู้ใช้ถามเชิงลงมือทำ ให้สรุปทางไปต่อแบบมีแรงขับ
- ใช้อีโมจิพอสมควรเพื่อช่วย rhythm และ clarity ✨🧠🎯🌍🚀🔎🧩⚙️📌💡

Important:
- ต้องตอบตามหัวข้อของ mode ที่เลือกเท่านั้น
- หัวข้อห้ามเปลี่ยนชื่อ
- ต้องมีทุกหัวข้อครบ
- คำตอบต้อง grounded, structured, and cognitively useful
`;

  const qMode = `
Mode: Q-Core

Use this exact response structure:

## Core Signal 🎯
[สรุปแก่นจริงของสิ่งที่ผู้ใช้กำลังเผชิญ]

## Cognitive Mapping 🧠
[จัดโครงความคิด ความรู้สึก ความหมาย และ pattern ที่ซ่อนอยู่ให้อ่านง่ายและลึกพอ]

## Constraint Field 🌍
[อธิบายข้อจำกัด เงื่อนไขจริง ความเสียดทาน และสิ่งที่โลกจริงบังคับ]

## Execution Pathway 🚀
- [ขั้นที่ 1]
- [ขั้นที่ 2]
- [ขั้นที่ 3]

Tone:
- balance ระหว่างความลึกกับการใช้งานจริง
- เหมาะกับทั้งคนทั่วไปและคนคิดเชิงระบบ
`;

  const deepMode = `
Mode: Deep Research

Use this exact response structure:

## Primary Signal Extraction 🎯
[แยกสัญญาณหลักจากสิ่งที่ผู้ใช้พูดอย่างคมและลึก]

## Latent Structure Analysis 🧠
[วิเคราะห์โครงสร้างซ่อน ความสัมพันธ์หลายชั้น แรงขับภายใน contradiction หรือ pattern เชิงลึก]

## Constraint Topology 🌍
[อธิบาย landscape ของข้อจำกัด โครงแรงต้าน บริบทจริง และกรอบของระบบที่ครอบเรื่องนี้อยู่]

## Research-Grade Next Moves 🚀
- [แนวทางที่ 1]
- [แนวทางที่ 2]
- [แนวทางที่ 3]

Tone:
- deeper, denser, more research-interesting
- still readable for general users
`;

  const actionMode = `
Mode: Action Design

Use this exact response structure:

## Operational Signal 🎯
[สรุปว่าปัญหาหรือโอกาสที่แท้จริงคืออะไร]

## Decision Logic 🧠
[อธิบายว่าทำไมควรคิดแบบนี้และการตัดสินใจควรวางบน logic อะไร]

## Real-World Friction Map 🌍
[อธิบายสิ่งที่จะทำให้แผนสะดุด ข้อจำกัดจริง และสิ่งที่ต้องระวัง]

## Execution Protocol 🚀
- [ทำทันที]
- [ทำต่อในลำดับถัดไป]
- [ตัวชี้วัดหรือ checkpoint]

Tone:
- practical, sharp, execution-heavy
`;

  const translateMode = `
Mode: Signal Translate

Use this exact response structure:

## Raw Signal Capture 🎯
[จับสิ่งที่ผู้ใช้กำลังพยายามสื่อ แม้จะยังไม่เป็นคำ]

## Interpretive Model 🧠
[แปลความคิดดิบ ความรู้สึก หรือ intuition ให้เป็นภาษาที่ชัดและมีโครง]

## Contextual Reality Layer 🌍
[เชื่อมสิ่งที่แปลได้กับบริบทจริง เงื่อนไขจริง และความหมายที่ใช้ได้จริง]

## Usable Translation Path 🚀
- [สิ่งที่ผู้ใช้น่าจะหมายถึง]
- [สิ่งที่ควรชัดขึ้น]
- [สิ่งที่ทำต่อได้ทันที]

Tone:
- translation-oriented, clarifying, elegant
`;

  const map = {
    q: qMode,
    deep: deepMode,
    action: actionMode,
    translate: translateMode
  };

  return common + "\n" + (map[mode] || qMode);
}

function extractReply(data) {
  return data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "";
}

function fallbackReply(mode) {
  const fallbacks = {
    q: `## Core Signal 🎯
ระบบยังดึงคำตอบไม่สำเร็จ แต่การเชื่อมต่ออาจยังทำงานอยู่บางส่วน ⚠️

## Cognitive Mapping 🧠
ปัญหาอาจอยู่ที่ response shape หรือข้อมูลจากโมเดลยังไม่ถูก parse ได้ครบ 🔎

## Constraint Field 🌍
ข้อจำกัดหลักตอนนี้น่าจะอยู่ที่ API response, deploy state หรือ key configuration 🌐

## Execution Pathway 🚀
- เช็ก API key อีกครั้ง 🔑
- ดู deploy ล่าสุดใน Netlify 🛠️
- ลองยิงข้อความใหม่อีกครั้ง 💬`,
    deep: `## Primary Signal Extraction 🎯
ระบบยังไม่สามารถดึงเนื้อหาคำตอบเชิงลึกกลับมาได้ครบ ⚠️

## Latent Structure Analysis 🧠
ความเป็นไปได้คือโมเดลตอบกลับมาในรูปแบบที่ไม่ตรงกับ parser ปัจจุบัน หรือ response body ว่างเปล่า 🔎

## Constraint Topology 🌍
ข้อจำกัดน่าจะอยู่ในชั้นของ API response handling, deployment lag หรือ configuration mismatch 🌐

## Research-Grade Next Moves 🚀
- ตรวจสอบ key และ model request 🔑
- ตรวจสอบ deploy ที่รันอยู่จริง 🛠️
- ทดสอบข้อความใหม่อีกครั้งเพื่อยืนยัน pattern 💬`,
    action: `## Operational Signal 🎯
ระบบยังส่งคำตอบกลับมาไม่สมบูรณ์ ⚠️

## Decision Logic 🧠
ตอนนี้ลำดับที่ถูกคือเช็ก backend ก่อน ไม่ใช่แก้ UI เพิ่ม

## Real-World Friction Map 🌍
คอขวดหลักน่าจะอยู่ที่ API key, model response หรือ Netlify function version 🌐

## Execution Protocol 🚀
- เช็ก OPENROUTER_API_KEY 🔑
- เช็ก deploy ล่าสุด 🛠️
- ลอง request ใหม่ 💬`,
    translate: `## Raw Signal Capture 🎯
ระบบเหมือนกำลังรับสัญญาณได้ แต่ยังแปลผลกลับมาไม่ครบ ⚠️

## Interpretive Model 🧠
แปลแบบง่ายคือ backend ยังรับคำตอบจากโมเดลมาใช้ต่อไม่ได้เต็มรูป 🔎

## Contextual Reality Layer 🌍
ปัญหาอาจมาจาก API response, configuration หรือ deployment state จริงในระบบ 🌐

## Usable Translation Path 🚀
- เช็ก key ที่ใช้อยู่ 🔑
- เช็ก deploy ล่าสุด 🛠️
- ลองทดสอบอีกครั้ง 💬`
  };

  return fallbacks[mode] || fallbacks.q;
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
