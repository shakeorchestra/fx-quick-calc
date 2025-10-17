// api/quote.js
// Vercel Serverless Function: base→target の為替レートをしぶとく取得して返す

const FRANKFURTER_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
  "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
  "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
]);

const withTimeout = (ms, fetchPromise) =>
  Promise.race([
    fetchPromise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);

async function getJSON(url, timeoutMs = 8000) {
  const res = await withTimeout(timeoutMs, fetch(url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 各APIを順に試す（Frankfurter → exchangerate.host → open.er-api → 逆方向）
async function tryFrankfurter(base, target) {
  if (!FRANKFURTER_CODES.has(base)) return null;
  try {
    const data = await getJSON(`https://api.frankfurter.app/latest?from=${base}&to=${target}`);
    const r = data?.rates?.[target];
    if (typeof r === "number") return { rate: r, date: data?.date || "" };
  } catch (_) {}
  return null;
}

async function tryERHConvert(base, target) {
  try {
    const data = await getJSON(`https://api.exchangerate.host/convert?from=${base}&to=${target}`);
    const r = data?.result;
    if (typeof r === "number") return { rate: r, date: data?.date || "" };
  } catch (_) {}
  return null;
}

async function tryERHLatest(base, target) {
  try {
    const data = await getJSON(`https://api.exchangerate.host/latest?base=${base}&symbols=${target}`);
    const r = data?.rates?.[target];
    if (typeof r === "number") return { rate: r, date: data?.date || "" };
  } catch (_) {}
  return null;
}

async function tryERAPI(base, target) {
  try {
    const data = await getJSON(`https://open.er-api.com/v6/latest/${base}`);
    const r = data?.rates?.[target];
    if (typeof r === "number") return { rate: r, date: "" };
  } catch (_) {}
  return null;
}

async function tryInverse(base, target) {
  for (const f of [
    () => tryFrankfurter(target, base),
    () => tryERHConvert(target, base),
    () => tryERHLatest(target, base),
    () => tryERAPI(target, base),
  ]) {
    const inv = await f();
    if (inv?.rate) return { rate: 1 / inv.rate, date: inv.date || "" };
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const { base, target } = req.query;
    if (!base || !target) {
      res.status(400).json({ error: "missing base/target" });
      return;
    }

    for (const f of [
      () => tryFrankfurter(base, target),
      () => tryERHConvert(base, target),
      () => tryERHLatest(base, target),
      () => tryERAPI(base, target),
      () => tryInverse(base, target),
    ]) {
      const out = await f();
      if (out?.rate) {
        res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");
        res.status(200).json({ ok: true, ...out });
        return;
      }
    }

    res.status(200).json({ ok: false, rate: null, date: "" });
  } catch (e) {
    res.status(200).json({ ok: false, rate: null, date: "" });
  }
}
