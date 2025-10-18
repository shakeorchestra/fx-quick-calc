// src/api/quote.js
// AbstractAPI: https://www.abstractapi.com/api/exchange-rate-api
const ABSTRACT_API_KEY = "934964a55fbf49b390229269e794a981"; // ← あなたのキー（公開NG。Gitに上げない）

export default async function handler(req, res) {
  try {
    // 正規化（小文字で来てもOK）
    let { base, target } = req.query || {};
    base   = String(base || "").trim().toUpperCase();
    target = String(target || "").trim().toUpperCase();

    if (!base || !target) {
      return res.status(400).json({ error: "Missing base or target" });
    }
    if (base === target) {
      // 1:1 のときはAPI叩かず即返す
      return res.status(200).json({ rate: 1, date: new Date().toISOString() });
    }

    const url =
      `https://exchange-rates.abstractapi.com/v1/live/` +
      `?api_key=${ABSTRACT_API_KEY}&base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await response.text(); // まずテキストで受ける（APIがエラー時にHTML/テキスト返すケース対策）
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* JSONでない場合は空 */ }

    // AbstractAPIはエラー時に { error: { message, code } } を返す
    if (!response.ok || data?.error) {
      return res.status(response.status || 502).json({
        error: "Upstream API error",
        details: data?.error ?? text ?? null,
      });
    }

    // 期待レスポンス:
    // {
    //   "base": "USD",
    //   "exchange_rates": { "COP": 4332.1 },
    //   "last_updated": "2025-10-17T12:34:00Z"
    // }
    const rate = data?.exchange_rates?.[target];
    const date = data?.last_updated || "";

    if (typeof rate !== "number" || !isFinite(rate)) {
      return res.status(502).json({
        error: "No valid numeric rate in response",
        body: data,
      });
    }

    return res.status(200).json({ rate, date });
  } catch (err) {
    console.error("[/api/quote] error:", err);
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
}
