// src/api/rates.js
// しぶとい多段フォールバック: Frankfurter → exchangerate.host(convert)
// → exchangerate.host(latest) → 逆方向を反転

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

async function getJSON(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Frankfurter: base→target */
async function tryFrankfurter(base, target) {
  // Frankfurterは base が対応内のときのみ意味がある
  if (!FRANKFURTER_CODES.has(base)) return null;
  try {
    const data = await getJSON(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
    );
    const r = data?.rates?.[target];
    if (typeof r === "number") return { rate: r, date: data?.date || "" };
  } catch (e) {
    console.warn("Frankfurter failed:", e);
  }
  return null;
}

/** exchangerate.host convert: base→target */
async function tryERHConvert(base, target) {
  try {
    const data = await getJSON(
      `https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
    );
    const r = data?.result;
    if (typeof r === "number") return { rate: r, date: data?.date || "" };
  } catch (e) {
    console.warn("ERH convert failed:", e);
  }
  return null;
}

/** exchangerate.host latest: base→target */
async function tryERHLatest(base, target) {
  try {
    const data = await getJSON(
      `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(target)}`
    );
    const r = data?.rates?.[target];
    if (typeof r === "number") return { rate: r, date: data?.date || "" };
  } catch (e) {
    console.warn("ERH latest failed:", e);
  }
  return null;
}

/** 逆方向を取って反転 (target→base を取得し 1/率 にする) */
async function tryInverse(base, target) {
  // Frankfurterで逆方向
  const invF = await tryFrankfurter(target, base);
  if (invF?.rate) return { rate: 1 / invF.rate, date: invF.date };

  // ERH convert で逆方向
  const invC = await tryERHConvert(target, base);
  if (invC?.rate) return { rate: 1 / invC.rate, date: invC.date };

  // ERH latest で逆方向
  const invL = await tryERHLatest(target, base);
  if (invL?.rate) return { rate: 1 / invL.rate, date: invL.date };

  return null;
}

/**
 * base→target のレートを1発で取得
 * 戻り値: { rate: number|null, date: string }
 */
export async function fetchPairRate(base, target) {
  // 1) Frankfurter（取れたら即返す）
  const f = await tryFrankfurter(base, target);
  if (f?.rate) return f;

  // 2) ERH convert
  const c = await tryERHConvert(base, target);
  if (c?.rate) return c;

  // 3) ERH latest
  const l = await tryERHLatest(base, target);
  if (l?.rate) return l;

  // 4) 逆方向を取得して反転
  const inv = await tryInverse(base, target);
  if (inv?.rate) return inv;

  // 5) 全滅
  return { rate: null, date: "" };
}
