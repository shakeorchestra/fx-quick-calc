// src/api/rates.js
// ✅ フロントだけで確実に動く / COP対応 / 例外は握りつぶし・安全値返却
// 優先: open.er-api.com → api.exchangerate.host → frankfurter.app
// 取れたものだけで USD ピボットのクロスレートを計算し、全部失敗なら 0 を返す（UIは "--" 表示）

const PIVOT = "USD";
const up = (s) => String(s || "").trim().toUpperCase();

async function safeJSON(url) {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    const t = await r.text();
    try { return t ? JSON.parse(t) : {}; } catch { return {}; }
  } catch { return {}; }
}

// 1) open.er-api.com（USD基準、CORS可）
async function viaOpenER(base, target) {
  const j = await safeJSON(`https://open.er-api.com/v6/latest/${PIVOT}`);
  const rb = j?.rates?.[base], rt = j?.rates?.[target];
  if (typeof rb === "number" && typeof rt === "number" && isFinite(rb) && isFinite(rt)) {
    return { ok: true, rate: rt / rb, date: j?.time_last_update_utc || "" };
  }
  return { ok: false };
}

// 2) api.exchangerate.host（USD基準）
async function viaExchangerateHost(base, target) {
  const syms = `${encodeURIComponent(base)},${encodeURIComponent(target)}`;
  const j = await safeJSON(`https://api.exchangerate.host/latest?base=${PIVOT}&symbols=${syms}`);
  const rb = j?.rates?.[base], rt = j?.rates?.[target];
  if (typeof rb === "number" && typeof rt === "number" && isFinite(rb) && isFinite(rt)) {
    return { ok: true, rate: rt / rb, date: j?.date || "" };
  }
  return { ok: false };
}

// 3) frankfurter（直接ペア）
async function viaFrankfurter(base, target) {
  const j = await safeJSON(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
  );
  const r = j?.rates?.[target];
  if (typeof r === "number" && isFinite(r)) {
    return { ok: true, rate: r, date: j?.date || "" };
  }
  return { ok: false };
}

export async function fetchRate(base, target) {
  base = up(base); target = up(target);
  if (!base || !target) return { rate: 0, date: "" };      // 安全値
  if (base === target)   return { rate: 1, date: new Date().toISOString() };

  // フォールバック順にトライ（例外はすべて吸収）
  const tries = [viaOpenER, viaExchangerateHost, viaFrankfurter];
  for (const fn of tries) {
    const res = await fn(base, target);
    if (res?.ok && typeof res.rate === "number" && isFinite(res.rate)) {
      return { rate: res.rate, date: res.date || "" };
    }
  }
  return { rate: 0, date: "" };  // すべて失敗時でも UI は "--" 表示で壊れない
}

// 旧名互換
export async function fetchPairRate(base, target) { return await fetchRate(base, target); }

// 通貨名
export function getCurrencyNameJa(code) {
  const m = {
    USD:"米ドル", JPY:"日本円", EUR:"ユーロ", GBP:"英ポンド",
    AUD:"豪ドル", CAD:"カナダドル", CHF:"スイスフラン",
    CNY:"中国人民元", KRW:"韓国ウォン", HKD:"香港ドル",
    SGD:"シンガポールドル", TWD:"台湾ドル", THB:"タイバーツ",
    INR:"インドルピー", IDR:"ルピア", PHP:"フィリピンペソ",
    MYR:"マレーシアリンギット", VND:"ベトナムドン",
    NZD:"ニュージーランドドル", BRL:"ブラジルレアル",
    ZAR:"南アフリカランド", PLN:"ポーランドズロチ",
    SEK:"スウェーデンクローナ", NOK:"ノルウェークローネ",
    DKK:"デンマーククローネ", TRY:"トルコリラ", MXN:"メキシコペソ",
    COP:"コロンビアペソ", ARS:"アルゼンチンペソ", CLP:"チリペソ",
    PEN:"ペルーソル", AED:"UAEディルハム", SAR:"サウジリヤル", ILS:"イスラエルシェケル",
  };
  return m[up(code)] || code;
}
