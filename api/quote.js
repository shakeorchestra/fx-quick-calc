// api/quote.js  —— Vercel Serverless Function (CommonJS)

const FR_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN","BRL","INR",
  "SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR","PLN","CZK","HUF","RON",
  "TRY","IDR","ILS","PHP","MYR","NZD"
]);

const withTimeout = (ms, p) =>
  Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);

async function getJSON(url, ms = 8000) {
  const res = await withTimeout(ms, fetch(url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** 1) exchangerate.host の convert (直接変換) */
async function tryEXConvert(base, target) {
  const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`;
  const data = await getJSON(url);
  if (typeof data?.result === "number") {
    return { rate: data.result, date: data?.date || "" };
  }
  return null;
}

/** 2) exchangerate.host の latest(base=USD) でクロス計算 */
async function tryEXCross(base, target) {
  const url = `https://api.exchangerate.host/latest?base=USD&symbols=${encodeURIComponent(base)},${encodeURIComponent(target)}`;
  const data = await getJSON(url);
  const rBase = data?.rates?.[base];
  const rTarget = data?.rates?.[target];
  if (typeof rBase === "number" && typeof rTarget === "number") {
    // USD→target / USD→base = base→target
    const rate = rTarget / rBase;
    return { rate, date: data?.date || "" };
  }
  return null;
}

/** 3) Frankfurter（base が対応している場合のみ） */
async function tryFrankfurter(base, target) {
  if (!FR_CODES.has(base)) return null;
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`;
  const data = await getJSON(url);
  const r = data?.rates?.[target];
  if (typeof r === "number") {
    return { rate: r, date: data?.date || "" };
  }
  return null;
}

/** CJS ハンドラ */
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const base = url.searchParams.get("from") || url.searchParams.get("base");
    const target = url.searchParams.get("to") || url.searchParams.get("target");

    if (!base || !target) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ error: "missing base/target" }));
    }

    // 1) convert 直
    try {
      const r1 = await tryEXConvert(base, target);
      if (r1) {
        res.setHeader("content-type", "application/json; charset=utf-8");
        return res.end(JSON.stringify(r1));
      }
    } catch {}

    // 2) USD クロス
    try {
      const r2 = await tryEXCross(base, target);
      if (r2) {
        res.setHeader("content-type", "application/json; charset=utf-8");
        return res.end(JSON.stringify(r2));
      }
    } catch {}

    // 3) Frankfurter（対応 base のみ）
    try {
      const r3 = await tryFrankfurter(base, target);
      if (r3) {
        res.setHeader("content-type", "application/json; charset=utf-8");
        return res.end(JSON.stringify(r3));
      }
    } catch {}

    // 全部失敗
    res.statusCode = 200; // 200で返しつつ rate:null（フロントで「—」表示）
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ rate: null, date: "" }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ error: e.message || "server error" }));
  }
};
