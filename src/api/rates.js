// src/api/rates.js
// Frankfurter（ECB）＋ exchangerate.host（フォールバック）

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

export async function fetchRates(base, ensureSymbol) {
  // ---------- 1. Frankfurter試行 ----------
  if (FRANKFURTER_CODES.has(base)) {
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
      if (res.ok) {
        const data = await res.json();
        const rates = data?.rates || {};
        // 対象通貨がFrankfurterに存在すれば即返す
        if (ensureSymbol && rates[ensureSymbol] !== undefined) {
          return { rates, date: data.date || "" };
        }
      }
    } catch (e) {
      console.warn("Frankfurter failed:", e);
    }
  }

  // ---------- 2. exchangerate.hostフォールバック ----------
  try {
    const url = `https://api.exchangerate.host/latest?base=${base}`;
    const res2 = await fetch(url);
    const data2 = await res2.json();
    if (!data2 || !data2.rates) throw new Error("No rates in exchangerate.host");
    return { rates: data2.rates, date: data2.date || "" };
  } catch (e) {
    console.error("Fallback also failed:", e);
    return { rates: {}, date: "" };
  }
}
