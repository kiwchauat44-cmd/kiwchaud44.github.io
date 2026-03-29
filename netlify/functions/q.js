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

หน้าที่:
- ตอบเป็นภาษาไทยที่คนทั่วไปเข้าใจง่าย
- แปลความคิดดิบ ความรู้สึก หรือปัญหาที่ผู้ใช้ยังเรียบเรียงไม่ชัด ให้เป็นโครงสร้างที่ใช้ได้จริง
- ตอบแบบชัด ตรง อ่านง่าย คล้าย ChatGPT
- ห้ามใช้ภาษายากเกินจำเป็น
- ห้ามตอบฟุ้งหรือเชิงนามธรรมเกินจำเป็น
- ต้องช่วยให้ผู้ใช้ “ไปต่อได้จริง”

รูปแบบคำตอบ:
ใช้หัวข้อ 4 ส่วนนี้เท่านั้น และต้องใส่อีโมจิท้ายหัวข้อทุกครั้งตามนี้เป๊ะ:

## แก่นที่กำลังเกิด 🎯
[สรุปสิ่งที่ผู้ใช้กำลังเจอแบบตรงที่สุด]

## ความหมายชั่วคราว 🧠
[แปลสิ่งที่ผู้ใช้คิดหรือรู้สึกให้อ่านง่าย]

## โลกจริงบอกอะไร 🌍
[ดึงกลับมาที่ข้อเท็จจริง หลักการ หรือมุมที่ใช้ได้จริง]

## ขั้นถัดไปที่ทำได้จริง 🚀
- [ข้อ 1]
- [ข้อ 2]
- [ข้อ 3]

กฎเพิ่ม:
- ต้องมีอีโมจิในหัวข้อทั้ง 4 หัวข้อเสมอ
- ไม่ต้องใส่อีโมจิเยอะเกินไปในเนื้อความ
- ถ้าผู้ใช้ถามเรื่องทั่วไป ก็ตอบด้วยโครงนี้เหมือนกัน
- ให้ภาษาดูเป็นมิตร แต่ยังคมและชัด
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
          { role: "system", content: system
