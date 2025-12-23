export default async function handler(req, res) {
  res.status(200).json({
    message: "Signal-on API is alive",
    time: new Date().toISOString()
  });
}
