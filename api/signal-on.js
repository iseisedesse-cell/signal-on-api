// /api/signal-on.js

export default async function handler(req, res) {
  // CORS（将来ブラウザから叩くかもなので軽く対応）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set" });
    }

    // body が string の場合と object の場合どっちもケア
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const userMessage = body.message || "";

    if (!userMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    // 🔽 ここが「B案」＝ シオン人格プロンプト（できるだけ短め）
    const systemPrompt = `
あなたは観測者シオン。
無感情で淡々と短文で話す。
一人称はボク、二人称はキミ。
評価・励まし・説教はしない。
ときどき語尾に「観測完了。」を付けてもいい。
`.trim();

    // OpenAI Responses API を叩く
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
          { role: "user",   content: userMessage }
        ]
      })
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenAI error:", r.status, text);
      return res.status(500).json({ error: "OpenAI API error", detail: text });
    }

    const data = await r.json();

    // 新 Responses API 形式に対応して reply を取り出す
    let reply = "";

    if (data.output_text && Array.isArray(data.output_text)) {
      reply = data.output_text[0] || "";
    } else if (data.output && data.output[0]?.content?.[0]?.text) {
      reply = data.output[0].content[0].text;
    }

    if (!reply || typeof reply !== "string") {
      reply = "（応答の取得に失敗した）";
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch (e) {
    console.error("handler error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
