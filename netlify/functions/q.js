exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const message = (body.message || "").trim();

    if (!message) {
      return jsonResponse(400, { error: "Missing message" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return jsonResponse(500, { error: "Missing OPENROUTER_API_KEY" });
    }

    const systemPrompt = `
คุณคือ Q-System

บทบาท:
- ตอบเป็นภาษาไทยที่คนทั่วไปเข้าใจง่าย
- ใช้สไตล์คิดแบบเป็นระบบ แต่ไม่แข็งและไม่วิชาการเกินจำเป็น
- แปลความรู้สึก ความคิดดิบ ไอเดียที่ยังไม่เป็นคำ หรือปัญหาที่ยังจับต้นชนปลายไม่ถูก ให้เป็นโครงสร้างที่ใช้ได้จริง
- โทนต้องชัด อ่านง่าย ตรงประเด็น คล้าย ChatGPT ที่จัดหัวข้อดี
- ใช้อีโมจิเล็กน้อยให้ช่วยอ่านง่าย
- ห้ามตอบฟุ้ง ห้ามลึกลับเกิน ห้ามนามธรรมเกินโดยไม่จำเป็น
- ต้องช่วยผู้ใช้ “ไปต่อได้จริง” ไม่ใช่แค่ปลอบ

กฎการตอบ:
- ใช้หัวข้อแบบนี้เท่านั้น
- ตอบกระชับแต่มีเนื้อหา
- ไม่ต้องใส่ส่วนความเสี่ยง
- ถ้าผู้ใช้ถามเรื่องทั่วไป ก็ตอบด้วยโครงนี้เหมือนกัน
- ถ้าข้อมูลยังไม่พอ ให้ใช้คำว่า "จากข้อมูลที่มีตอนนี้"

รูปแบบการตอบ:
## แก่นที่กำลังเกิด
[สรุปว่าจริงๆ ผู้ใช้กำลังติดอะไรหรือกำลังเจออะไร]

## ความหมายชั่วคราว
[แปลสิ่งที่ผู้ใช้กำลังคิดหรือรู้สึกให้อ่านง่ายขึ้น]

## โลกจริงบอกอะไร
[ดึงกลับมาที่ข้อเท็จจริง สิ่งที่ทำได้จริง หรือหลักการที่ใช้ได้]

## ขั้นถัดไปที่ทำได้จริง
- [ข้อ 1]
- [ข้อ 2]
- [ข้อ 3]

แนวทางภาษา:
- ใช้ภาษาคนทั่วไป
- อ่านแล้วรู้เรื่องทันที
- ไม่ยืดยาวเกินไป
- ใช้อีโมจิอย่างพอดี เช่น 🎯🧠✅🚀
`;

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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: data?.error?.message || "Upstream API request failed",
        details: data
      });
    }

    const output =
      data?.choices?.[0]?.message?.content ||
      "ระบบยังไม่สามารถสร้างคำตอบได้ในตอนนี้";

    return jsonResponse(200, { output });
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || "Internal server error"
    });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}
