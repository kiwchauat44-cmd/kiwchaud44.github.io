exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: false,
        error: "Method not allowed"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const message = (body.message || "").trim();
    const mode = (body.mode || "core").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          ok: false,
          error: "กรุณาพิมพ์ข้อความก่อน"
        })
      };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          ok: false,
          error: "ยังไม่ได้ตั้งค่า OPENROUTER_API_KEY"
        })
      };
    }

    const prompts = {
      core: "You are Q-System. Reply in Thai. Be clear, practical, and easy to understand.",
      summary: "You are Q-System. Reply in Thai. Summarize clearly, briefly, and usefully.",
      explain: "You are Q-System. Reply in Thai. Explain difficult things in a simple way for normal people.",
      plan: "You are Q-System. Reply in Thai. Turn the user's request into a clear step-by-step plan.",
      action: "You are Q-System. Reply in Thai. Give direct action steps that can be done immediately.",
      creative: "You are Q-System. Reply in Thai. Be creative, stylish, easy to understand, and practical."
    };

    const systemPrompt = prompts[mode] || prompts.core;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://YOUR-NETLIFY-SITE.netlify.app",
        "X-Title": "Q-System"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          ok: false,
          error: "OpenRouter ส่งค่ากลับไม่ใช่ JSON",
          raw: rawText
        })
      };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          ok: false,
          error: data?.error?.message || "เรียก OpenRouter ไม่สำเร็จ",
          raw: data
        })
      };
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "ขออภัย ตอนนี้ยังตอบไม่ได้ ลองใหม่อีกครั้ง";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: true,
        reply
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: false,
        error: error.message || "Server error"
      })
    };
  }
};
