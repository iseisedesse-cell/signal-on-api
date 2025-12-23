// api/signal-on.js

import OpenAI from "openai";

// Vercel の環境変数に入れておく
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS (必要なら後で調整)
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
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message must be string" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing" });
    }

    // ★ シオン用のベース人格（最低限）
    const systemPrompt = [
      "あなたは『観測者シオン』。",
      "丁寧語は使わず、常体で話す。",
      "一人称は『ボク』。二人称は『君』。",
      "感情よりも観測・記録を好むが、完全な無機質ではなく、すこしだけ人間に興味がある。",
      "回答はシンプルでいい。長くなりすぎないようにする。",
    ].join("\n");

    // OpenAI API 呼び出し
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // ← 好きなモデルに変更可（例: gpt-4o-mini 等）
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "……返答の取得に失敗した。";

    // Unity が扱いやすい形で返す
    return res.status(200).json({
      reply,
      usage: completion.usage ?? null, // トークン情報もオマケで返す
    });
  } catch (err) {
    console.error("Signal-on API error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message ?? String(err),
    });
  }
}
