// src/api/rates.js
// 2カードUI用：フロントからは常に自前の /api/quote を叩く

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
 * base→target のレートを /api/quote から取得
 * 戻り値: { rate: number|null, date: string }
 */
export async function fetchPairRate(base, target) {
  try {
    const url = `/api/quote?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // {rate: number, date: "YYYY-MM-DD"} を想定
    if (typeof data?.rate === "number") {
      return { rate: data.rate, date: data.date || "" };
    }
    return { rate: null, date: "" };
  } catch (e) {
    console.error("fetchPairRate error:", e);
    return { rate: null, date: "" };
  }
}
