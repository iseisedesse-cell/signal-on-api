// api/signal-on.js

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // ここはテスト用のダミー返答（あとでGPTにつなぐ）
    return res.status(200).json({
      reply: `観測完了。「${message}」`
    });
  }

  // GETとか他メソッドで来たとき用（動作確認用）
  return res.status(200).json({
    ok: true,
    info: "Signal-on API endpoint is alive.",
    method: req.method
  });
}
