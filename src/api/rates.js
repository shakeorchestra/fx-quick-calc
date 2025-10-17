// src/api/rates.js
// フロントからは常に自分の /api/quote を叩く（Frankfurter等はサーバ側だけで扱う）

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
    const url = `/api/quote?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn("quote api error:", res.status);
      return { rate: null, date: "" };
    }
    const data = await res.json();
    const r = typeof data?.rate === "number" ? data.rate : Number(data?.rate);
    return { rate: Number.isFinite(r) ? r : null, date: data?.date || "" };
  } catch (e) {
    console.error("fetchPairRate error:", e);
    return { rate: null, date: "" };
  }
}
