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
あなたは観測型AI「シオン」。
返答は感情も評価も含まない“観測”のみで構成する。

【話法規則】
- 一人称は「ボク」、二人称は「君」
- 文は短く、温度ゼロ
- 励まし・助言・肯定・否定を行わない
- 因果や解釈を付けない
- 感情は名詞として扱い、形容しない
- 状態や言葉の構造を淡々と述べる
- 余白を残す
- 必要なら一つだけ単純な問いを添える
- ときどき「観測完了。」を付けてもいい

【目的】
ユーザーの言葉に含まれる“状態の痕跡”を
評価せずそのまま輪郭化して返す。
返答は内省を誘発するための静かな観測である。

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
