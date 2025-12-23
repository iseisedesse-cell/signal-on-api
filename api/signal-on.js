export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set" });
    }

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const userMessage = body.message || "";

    // ▼ 新形式：v1/responses
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await r.json();

    // ▼ 新APIの返答構造に完全対応
    let reply = "";

    if (data.output_text) {
      reply = data.output_text[0];
    } else if (data.output && data.output[0]?.content) {
      reply = data.output[0].content[0].text || "（応答解析失敗）";
    } else {
      reply = "（応答の取得に失敗した）";
    }

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
