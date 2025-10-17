// api/quote.js
// CommonJS形式: Vercel Node Function で確実に動く為替レートAPI

const FRANKFURTER_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
  "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
  "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
]);

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getRate(base, target) {
  // 1) Frankfurter
  if (FRANKFURTER_CODES.has(base)) {
    try {
      const data = await getJSON(`https://api.frankfurter.app/latest?from=${base}&to=${target}`);
      const r = data?.rates?.[target];
      if (typeof r === "number") return { rate: r, date: data.date, source: "frankfurter" };
    } catch (_) {}
  }

  // 2) exchangerate.host
  try {
    const data = await getJSON(`https://api.exchangerate.host/convert?from=${base}&to=${target}`);
    const r = data?.result;
    if (typeof r === "number") return { rate: r, date: data.date, source: "exchangerate.host" };
  } catch (_) {}

  // 3) open.er-api.com
  try {
    const data = await getJSON("https://open.er-api.com/v6/latest/USD");
    if (data?.rates?.[base] && data?.rates?.[target]) {
      const r = data.rates[target] / data.rates[base];
      return { rate: r, date: data.time_last_update_utc, source: "open.er-api" };
    }
  } catch (_) {}

  return null;
}

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const from = String(q.from || q.base || "").toUpperCase();
    const to = String(q.to || q.target || "").toUpperCase();

    if (!from || !to) {
      res.status(400).json({ error: "missing base/target" });
      return;
    }

    const data = await getRate(from, to);
    if (!data) {
      res.status(502).json({ error: "rate unavailable" });
      return;
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

module.exports.config = { runtime: "nodejs18.x" };
