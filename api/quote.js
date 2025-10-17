// api/quote.js
// Vercel Serverless Function: base→target の為替レートを返す（堅牢フォールバック付き）

const FRANKFURTER_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
  "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
  "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
]);

const withTimeout = (ms, p) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

async function getJSON(url, timeoutMs = 8000) {
  const res = await withTimeout(timeoutMs, fetch(url));
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

/** 1) Frankfurter（base が対応のときのみ） */
async function tryFrankfurter(base, target) {
  if (!FRANKFURTER_CODES.has(base)) return null;
  try {
    const data = await getJSON(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
    );
    const r = data?.rates?.[target];
    if (typeof r === "number") {
      return { rate: r, date: data?.date || "", source: "frankfurter" };
    }
  } catch (_) {}
  return null;
}

/** 2) exchangerate.host の /convert */
async function tryExchangerateHost(base, target) {
  try {
    const data = await getJSON(
      `https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
    );
    const r = data?.result;
    if (typeof r === "number") {
      return { rate: r, date: data?.date || "", source: "exchangerate.host" };
    }
  } catch (_) {}
  return null;
}

/** 3) open.er-api.com（USD 基準表から計算） */
async function tryOpenErApi(base, target) {
  try {
    const data = await getJSON("https://open.er-api.com/v6/latest/USD");
    const rates = data?.rates;
    if (rates && rates[base] && rates[target]) {
      // USD→target / USD→base = base→target
      const r = rates[target] / rates[base];
      const date = data?.time_last_update_utc?.slice(0, 16) || "";
      if (Number.isFinite(r)) return { rate: r, date, source: "open.er-api" };
    }
  } catch (_) {}
  return null;
}

// ---- Serverless handler (CommonJS) ----
module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const base = String(q.from || "").toUpperCase();
    const target = String(q.to || "").toUpperCase();

    if (!base || !target) {
      res.status(400).json({ error: "missing base/target" });
      return;
    }

    const ans =
      (await tryFrankfurter(base, target)) ||
      (await tryExchangerateHost(base, target)) ||
      (await tryOpenErApi(base, target));

    if (!ans) {
      res.status(502).json({ error: "rate_unavailable" });
      return;
    }

    // CDN キャッシュ（任意）
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(ans);
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: "internal_error", message: String(e?.message || e) });
  }
};

// Vercel ランタイムを Node 18 に固定（fetch が使える）
module.exports.config = { runtime: "nodejs18.x" };
