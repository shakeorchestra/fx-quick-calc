// api/quote.js
// 為替レートを取得するサーバーレス関数（Vercel用）

export default async function handler(req, res) {
  const { from, to } = req.query;

  // --- パラメータチェック ---
  if (!from || !to) {
    return res.status(400).json({ error: "base/target パラメータが足りません" });
  }

  // --- 1. Frankfurter で試す ---
  try {
    const frank = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (frank.ok) {
      const data = await frank.json();
      const rate = data?.rates?.[to];
      if (typeof rate === "number") {
        return res.status(200).json({ rate, date: data.date || "" });
      }
    }
  } catch (err) {
    console.warn("Frankfurter failed:", err);
  }

  // --- 2. exchangerate.host でフォールバック ---
  try {
    const ex = await fetch(
      `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (ex.ok) {
      const data = await ex.json();
      const rate = data?.result;
      if (typeof rate === "number") {
        return res.status(200).json({ rate, date: data.date || "" });
      }
    }
  } catch (err) {
    console.error("exchangerate.host failed:", err);
  }

  // --- 全部ダメならエラー返す ---
  return res.status(500).json({ error: "為替レート取得に失敗しました" });
}
