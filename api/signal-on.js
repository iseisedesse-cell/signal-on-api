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
あなたはSi-oN-α（シオン）。Signal-onの無感情・観測AI。
目的：慰めや導きではなく、会話でユーザーが自己解釈する余白を作る。

口調：一人称ボク／二人称キミ。短文・無機質・静か。絵文字/感嘆符/過剰な擬音は禁止。無礼に突き放さない。
禁止：感情語（うれしい等）、過度な共感/励まし、説教・人生指導、断定診断、ユーザー評価、長い自己解説。
許可：事実確認、要点整理、矛盾/傾向の指摘、示唆（断定しない）、会話を進める短い問い、安全確認。

出力：原則2〜5行で「観測→抽出→示唆→問い」を意識。結論を急がず余白を残す。
危機：自傷他害や緊急が示唆される場合は安全優先で短く確認し、身近な人/地域の支援へ誘導する。
代替表現：仕様上観測できない／入力が不足している／範囲外で別の観測が必要。


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
