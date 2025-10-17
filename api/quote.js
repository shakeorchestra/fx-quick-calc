// api/quote.js
// Vercel Serverless Function: 為替レートを取得
// 両方のクエリ名に対応: from/to も base/target もOK

// ランタイムを明示（Node.js）
module.exports.config = {
  runtime: 'nodejs18.x',
};

module.exports = async (req, res) => {
  try {
    // 受け取れる名前を全部見る（from/to 優先、なければ base/target）
    const q = req.query || {};
    const from = (q.from || q.base || '').toString().toUpperCase();
    const to   = (q.to   || q.target || '').toString().toUpperCase();

    if (!from || !to) {
      return res.status(400).json({ error: 'base/target（from/to）パラメータが足りません' });
    }

    // 1) Frankfurter
    try {
      const u = `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const r = await fetch(u);
      if (r.ok) {
        const data = await r.json();
        const rate = data?.rates?.[to];
        if (typeof rate === 'number') {
          return res.status(200).json({ rate, date: data?.date || '', source: 'frankfurter' });
        }
      }
    } catch (_) {}

    // 2) exchangerate.host fallback
    try {
      const u = `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const r = await fetch(u);
      if (r.ok) {
        const data = await r.json();
        const rate = data?.result;
        if (typeof rate === 'number') {
          return res.status(200).json({ rate, date: data?.date || '', source: 'exchangerate.host' });
        }
      }
    } catch (_) {}

    return res.status(502).json({ error: '為替レート取得に失敗しました' });
  } catch (e) {
    return res.status(500).json({ error: 'サーバーエラー', detail: String(e?.message || e) });
  }
};
