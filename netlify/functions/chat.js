exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: false, error: "Method not allowed" })
    };
  }

  try {
    const { message = "", mode = "core" } = JSON.parse(event.body || "{}");

    if (!message.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ ok: false, error: "กรุณาพิมพ์ข้อความก่อน" })
      };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ ok: false, error: "ยังไม่ได้ตั้งค่า OPENROUTER_API_KEY" })
      };
    }

    const prompts = {
      core: "You are Q-System. Reply in Thai. Be clear and helpful.",
      summary: "You are Q-System. Reply in Thai. Summarize clearly and briefly.",
      explain: "You are Q-System. Reply in Thai. Explain simply for normal people.",
      plan: "You are Q-System. Reply in Thai. Turn the request into step-by-step plan.",
      action: "You are Q-System. Reply in Thai. Give direct action steps.",
      creative: "You are Q-System. Reply in Thai. Be creative and easy to understand."
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-netlify-site.netlify.app",
        "X-Title": "Q-System"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: prompts[mode] || prompts.core },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          ok: false,
          error: data?.error?.message || "เรียก API ไม่สำเร็จ"
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: true,
        reply: data?.choices?.[0]?.message?.content || "ยังตอบไม่ได้"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
