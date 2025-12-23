export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // 仮返答（あとでGPTにつなぐ）
  return res.status(200).json({
    reply: `観測完了。「${message}」`
  });
}
