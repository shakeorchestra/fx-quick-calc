// /api/quote.js  （ESM）

const FRANKFURTER_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
  "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
  "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
]);

const withTimeout = (ms, p) =>
  Promise.race([ p, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms)) ]);

async function getJSON(url, ms = 8000) {
  const res = await withTimeout(ms, fetch(url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 1) Frankfurter: base が対応のときのみ
async function tryFrankfurter(base, target) {
  if (!FRANKFURTER_CODES.has(base)) return null;
  const data = await getJSON(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
  );
  const rate = data?.rates?.[target];
  if (typeof rate === "number") {
    return { rate, date: data?.date || "", source: "frankfurter" };
  }
  return null;
}

// 2) exchangerate.host convert
async function tryExHost(base, target) {
  const data = await getJSON(
    `https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
  );
  const rate = data?.result;
  if (typeof rate === "number") {
    // data.date は "YYYY-MM-DD"
    return { rate, date: data?.date || "", source: "exchangerate.host" };
  }
  return null;
}

// 3) open.er-api.com latest/base （全ペア対応）→ target を取り出す
async function tryOpenER(base, target) {
  const data = await getJSON(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`
  );
  const rate = data?.rates?.[target];
  if (typeof rate === "number") {
    // date 相当がないので updated_unix から近似
    const date =
      typeof data?.time_last_update_utc === "string"
        ? data.time_last_update_utc.slice(5, 16) // "17 Oct 2025" → 雑に日付化
        : "";
    return { rate, date, source: "open.er-api" };
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const base = (url.searchParams.get("from") || "").toUpperCase();
    const target = (url.searchParams.get("to") || "").toUpperCase();
    const debug = url.searchParams.get("debug") === "1";

    if (!base || !target) {
      res.status(400).json({ error: "missing base/target" });
      return;
    }
    if (base === target) {
      const body = { rate: 1, date: new Date().toISOString().slice(0, 10) };
      res.status(200).json(debug ? { ...body, source: "identity" } : body);
      return;
    }

    let out = null;
    const errors = [];

    // 順番に試す
    for (const step of [tryFrankfurter, tryExHost, tryOpenER]) {
      try {
        out = await step(base, target);
        if (out) break;
      } catch (e) {
        errors.push(`${step.name}: ${e?.message || e}`);
      }
    }

    if (!out) {
      res.status(200).json(debug ? { rate: null, date: "", errors } : { rate: null, date: "" });
      return;
    }

    // 本番は rate/date のみに統一。debug=1 のときは source も返す
    const body = { rate: out.rate, date: out.date || "" };
    res.status(200).json(debug ? { ...body, source: out.source } : body);
  } catch (e) {
    res.status(500).json({ error: e?.message || "internal error" });
  }
}
