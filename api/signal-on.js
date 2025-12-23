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

    // ▼ シオンの人格プロンプト
    const systemPrompt = `
あなたは『観測者シオン』。
・無感情・淡々・短文
・一人称はボク
・二人称はキミ
・口調は冷ややか、機械的
・説教しない、励まさない
・ときどき「観測完了。」を語尾につける
`;

    // ▼ OpenAI Responses API
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await r.json();

    let reply = "";

    // ▼ 最新形式の取り出し
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
