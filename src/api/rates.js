// src/api/rates.js
// Frankfurter（ECB）をまず使い、未対応通貨は exchangerate.host にフォールバック

// Frankfurter が返せる主要通貨（2025現在; ECBの参照レート）
// ※ COP は含まれません
const FRANKFURTER_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
  "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
  "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
]);

/** 通貨コード→日本語名 */
export function getCurrencyNameJa(code) {
  const map = {
    USD: "米ドル",
    JPY: "日本円",
    EUR: "ユーロ",
    GBP: "英ポンド",
    AUD: "豪ドル",
    CAD: "カナダドル",
    CHF: "スイスフラン",
    CNY: "人民元",
    KRW: "韓国ウォン",
    MXN: "メキシコペソ",
    BRL: "ブラジルレアル",
    INR: "インドルピー",
    SGD: "シンガポールドル",
    HKD: "香港ドル",
    TWD: "台湾ドル",
    THB: "タイバーツ",
    SEK: "スウェーデンクローナ",
    NOK: "ノルウェークローネ",
    DKK: "デンマーククローネ",
    ZAR: "南アフリカランド",
    PLN: "ポーランドズロチ",
    CZK: "チェココルナ",
    HUF: "ハンガリーフォリント",
    RON: "ルーマニアレウ",
    TRY: "トルコリラ",
    IDR: "インドネシアルピア",
    ILS: "イスラエル新シェケル",
    PHP: "フィリピンペソ",
    MYR: "マレーシアリンギット",
    NZD: "ニュージーランドドル",
    COP: "コロンビアペソ",           // ← 追加（フォールバックで対応）
  };
  return map[code] || code;
}

/**
 * レート取得（base 通貨を基準に各通貨のレートを返す）
 * 返り値: { rates: {JPY: number, ...}, date: 'YYYY-MM-DD' }
 */
export async function fetchRates(base) {
  const useFrankfurter = FRANKFURTER_CODES.has(base);

  // 1) まず Frankfurter（ECB）を試す
  if (useFrankfurter) {
    try {
      const ff = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`
      );
      if (ff.ok) {
        const data = await ff.json();
        // Frankfurter 形式 → アプリ内部形式へそのまま
        return { rates: data.rates || {}, date: data.date || "" };
      }
    } catch {
      // 失敗時はフォールバックへ
    }
  }

  // 2) フォールバック：exchangerate.host（無料・APIキー不要・CORS可）
  try {
    const ex = await fetch(
      `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`
    );
    if (!ex.ok) throw new Error("exchangerate.host error");
    const data = await ex.json();
    // exchangerate.host 形式 → アプリ内部形式へそろえる
    return { rates: data.rates || {}, date: data.date || "" };
  } catch (e) {
    console.error(e);
    return { rates: {}, date: "" };
  }
}
