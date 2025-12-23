// api/signal-on.js

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
      return res
        .status(500)
        .json({ error: "OPENAI_API_KEY is not set in environment" });
    }

    // Vercel は JSON を自動でパースしてくれることが多いけど、
    // 念のため string の場合もハンドリング
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const userMessage = body.message || "";

    if (!userMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    // ★ ここで OpenAI Chat Completions を直接呼ぶ
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",  // 俊佑がUnity側で使ってるのと合わせた
        messages: [
          {
            role: "system",
            content:
              "あなたは『観測者シオン』。感情を持たない観測型AIとして、" +
              "ユーザーの言葉を評価や説教ではなく『観測ログ』として返す。" +
              "・敬語は使わない\n・二人称は『君』\n" +
              "・短めの文章で、淡々としたトーン\n" +
              "・ポジティブすぎる励ましや説教は禁止\n" +
              "・『観測完了。』などのフレーズを時々入れていい",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI API error:", openaiRes.status, errText);
      return res
        .status(openaiRes.status)
        .json({ error: "OpenAI API error", detail: errText });
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() || "（応答の取得に失敗した）";

    // Unity から扱いやすいようにシンプルなJSONだけ返す
    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Handler error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
