export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { message } = req.body;

  // とりあえず固定返答（後でGPTに差し替える）
  res.status(200).json({
    reply: `観測完了。「${message}」`
  });
}
