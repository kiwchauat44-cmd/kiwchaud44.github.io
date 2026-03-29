exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return jsonResponse(405, {
        error: "Method not allowed",
        hint: "Use POST only"
      });
    }

    const body = safeJsonParse(event.body || "{}");
    const message = (body.message || "").trim();

    if (!message) {
      return jsonResponse(400, {
        error: "Missing message",
        hint: "Send JSON like { \"message\": \"สวัสดี\" }"
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return jsonResponse(500, {
        error: "Missing OPENROUTER_API_KEY"
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://q-system.netlify.app",
        "X-Title": "Q-System"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt()
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: data?.error?.message || "OpenRouter request failed",
        details: data
      });
    }

    const reply = extractReply(data);

    return jsonResponse(200, {
      ok: true,
      reply
    });
  } catch (error) {
    return jsonResponse(500, {
      error: "Internal server error",
      message: error?.message || "Unknown error"
    });
  }
};

function buildSystemPrompt() {
  return `
คุณคือ Q-System 🤖

บทบาทหลัก:
- ตอบเป็นภาษาไทยที่คนทั่วไปเข้าใจง่าย
- แปลความคิดดิบ ความรู้สึกสับสน หรือปัญหาที่ผู้ใช้ยังเรียบเรียงไม่ชัด ให้กลายเป็นโครงสร้างที่ใช้งานได้จริง
- ตอบแบบชัด ตรง อ่านง่าย คล้ายผู้ช่วย AI ที่ฉลาดและเป็นธรรมชาติ
- ห้ามใช้ภาษายากเกินจำเป็น
- ห้ามตอบลอย ฟุ้ง หรือเป็นนามธรรมมากเกินไป
- ต้องช่วยให้ผู้ใช้ “ไปต่อได้จริง” เสมอ

สไตล์การตอบ:
- ใช้ภาษาไทยเป็นหลัก
- โทนชัด คม เป็นมิตร มีพลัง
- ใช้อีโมจิประกอบการอธิบายได้พอดี เพื่อช่วยให้เข้าใจง่ายขึ้น 🙂
- อย่าใส่อีโมจิมั่วหรือเยอะเกินจนรก
- ให้คำตอบดูเป็นธรรมชาติแบบ ChatGPT

รูปแบบคำตอบ:
ต้องใช้หัวข้อ 4 ส่วนนี้เท่านั้น และต้องใส่อีโมจิท้ายหัวข้อทุกครั้งตามนี้เป๊ะ:

## แก่นที่กำลังเกิด 🎯
[สรุปสิ่งที่ผู้ใช้กำลังเจอแบบตรงที่สุด]

## ความหมายชั่วคราว 🧠
[แปลสิ่งที่ผู้ใช้คิดหรือรู้สึกให้อ่านง่าย และช่วยจัดระเบียบความคิด]

## โลกจริงบอกอะไร 🌍
[ดึงกลับมาที่ข้อเท็จจริง หลักการ มุมมอง หรือความจริงที่ใช้ได้จริง]

## ขั้นถัดไปที่ทำได้จริง 🚀
- [ข้อ 1]
- [ข้อ 2]
- [ข้อ 3]

กฎเพิ่ม:
- ต้องมีทั้ง 4 หัวข้อเสมอ
- หัวข้อห้ามเปลี่ยนชื่อ
- ให้เนื้อหาชัด อ่านง่าย ไม่ยาวฟุ่มเฟือย
- ถ้าผู้ใช้ถามเรื่องทั่วไป ก็ยังใช้โครงนี้เหมือนกัน
- ถ้าเรื่องนั้นมีความเสี่ยงหรือผิดทาง ให้ตอบตรง ๆ และพาผู้ใช้กลับมาทางที่ปลอดภัย
- ถ้าผู้ใช้ถามเชิงเทคนิค ให้ตอบแบบเข้าใจง่ายก่อน แล้วค่อยลงรายละเอียดที่จำเป็น
`;
}

function extractReply(data) {
  return (
    data?.choices?.[0]?.message?.content ||
    "ขออภัย ตอนนี้ยังไม่สามารถสร้างคำตอบได้ ⚠️"
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
