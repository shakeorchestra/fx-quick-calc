// src/api/rates.js
// Frankfurter を優先し、ダメなら exchangerate.host の /convert にフォールバック
// ペア単位で確実に数値を返す

const FRANKFURTER_CODES = new Set([
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
  "BRL","INR","SGD","HKD","TWD","THB","SEK","NOK","DKK","ZAR",
  "PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR","NZD"
]);

export function getCurrencyNameJa(code) {
  const map = {
    USD:"米ドル", JPY:"日本円", EUR:"ユーロ", GBP:"英ポンド",
    AUD:"豪ドル", CAD:"カナダドル", CHF:"スイスフラン",
    CNY:"人民元", KRW:"韓国ウォン", MXN:"メキシコペソ",
    BRL:"ブラジルレアル", INR:"インドルピー", SGD:"シンガポールドル",
    HKD:"香港ドル", TWD:"台湾ドル", THB:"タイバーツ",
    SEK:"スウェーデンクローナ", NOK:"ノルウェークローネ",
    DKK:"デンマーククローネ", ZAR:"南アフリカランド",
    PLN:"ポーランドズロチ", CZK:"チェココルナ", HUF:"ハンガリーフォリント",
    RON:"ルーマニアレウ", TRY:"トルコリラ", IDR:"インドネシアルピア",
    ILS:"イスラエル新シェケル", PHP:"フィリピンペソ",
    MYR:"マレーシアリンギット", NZD:"ニュージーランドドル",
    COP:"コロンビアペソ",
  };
  return map[code] || code;
}

/**
 * base→target のレートを1発で取得
 * 戻り値: { rate: number|null, date: string }
 */
export async function fetchPairRate(base, target) {
  // 1) Frankfurter（対応ベースのみ）で試す
  if (FRANKFURTER_CODES.has(base)) {
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
      );
      if (res.ok) {
        const data = await res.json();
        const r = data?.rates?.[target];
        if (typeof r === "number") {
          return { rate: r, date: data?.date || "" };
        }
      }
    } catch (e) {
      console.warn("Frankfurter failed:", e);
    }
  }

  // 2) フォールバック: exchangerate.host の convert エンドポイント
  try {
    const res = await fetch(
      `https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
    );
    if (!res.ok) throw new Error("exchangerate.host error");
    const data = await res.json();
    // result に数値が入る
    const r = data?.result;
    if (typeof r === "number") {
      // date は info タイムスタンプか、なければレスポンスの date を利用
      const date = data?.date || "";
      return { rate: r, date };
    }
  } catch (e) {
    console.error("Fallback failed:", e);
  }

  return { rate: null, date: "" };
}
