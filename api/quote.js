// api/quote.js  ― 配線ヘルスチェック
export default async function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
      url: req.url,
      node: process.version,
      now: new Date().toISOString(),
    })
  );
}
