// api/quote.js  — ESM 専用（import/export だけを使う）
export default async function handler(req, res) {
  try {
    // req.url は相対なので自前で絶対URL化
    const url = new URL(req.url, `http://${req.headers.host}`);
    const from = url.searchParams.get("from")?.toUpperCase();
    const to   = url.searchParams.get("to")?.toUpperCase();

    if (!from || !to) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "missing from/to" }));
      return;
    }

    // Frankfurter が対応している base 通貨一覧
    const FRANKFURTER_CODES = new Set([
      "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
      "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
      "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
    ]);

    let rate = null;
    let date = "";

    // 1) Frankfurter（base が対応している場合）
    if (FRANKFURTER_CODES.has(from)) {
      const r1 = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (r1.ok) {
        const d1 = await r1.json();
        if (typeof d1?.rates?.[to] === "number") {
          rate = d1.rates[to];
          date = d1.date || "";
        }
      }
    }

    // 2) 取れなければ exchangerate.host にフォールバック
    if (typeof rate !== "number") {
      const r2 = await fetch(
        `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (r2.ok) {
        const d2 = await r2.json();
        if (typeof d2?.result === "number") {
          rate = d2.result;
          date = d2?.date || date;
        }
      }
    }

    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ rate: typeof rate === "number" ? rate : null, date }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
}
