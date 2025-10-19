// フロントのみ / 例外吸収 / 直接ペア優先で乖離縮小
const up = (s) => String(s || "").trim().toUpperCase();
const bust = () => `_=${Date.now()}`;

async function safeJSON(url) {
  const sep = url.includes("?") ? "&" : "?";
  const final = `${url}${sep}${bust()}`;
  try {
    const r = await fetch(final, { headers: { Accept: "application/json" }, cache: "no-store" });
    const t = await r.text();
    try { return t ? JSON.parse(t) : {}; } catch { return {}; }
  } catch { return {}; }
}

// 1) exchangerate.host convert(直接ペア)
async function viaERH(base, target) {
  const j = await safeJSON(
    `https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
  );
  const r = typeof j?.result === "number" ? j.result : (typeof j?.info?.rate === "number" ? j.info.rate : undefined);
  if (Number.isFinite(r)) return { ok: true, rate: r, date: j?.date || "" };
  return { ok: false };
}

// 2) open.er-api base板
async function viaOpenER(base, target) {
  const j = await safeJSON(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
  const r = j?.rates?.[target];
  if (Number.isFinite(r)) return { ok: true, rate: r, date: j?.time_last_update_utc || "" };
  return { ok: false };
}

// 3) frankfurter(直接ペア)
async function viaFrankfurter(base, target) {
  const j = await safeJSON(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
  );
  const r = j?.rates?.[target];
  if (Number.isFinite(r)) return { ok: true, rate: r, date: j?.date || "" };
  return { ok: false };
}

export async function fetchRate(base, target) {
  base = up(base); target = up(target);
  if (!base || !target) return { rate: 0, date: "" };
  if (base === target)   return { rate: 1, date: new Date().toISOString() };

  for (const fn of [viaERH, viaOpenER, viaFrankfurter]) {
    const res = await fn(base, target);
    if (res?.ok && Number.isFinite(res.rate)) return { rate: res.rate, date: res.date || "" };
  }
  return { rate: 0, date: "" };
}

export async function fetchPairRate(b, t){ return fetchRate(b, t); }

export function getCurrencyNameJa(code){
  const m={USD:"米ドル",JPY:"日本円",EUR:"ユーロ",GBP:"英ポンド",AUD:"豪ドル",CAD:"カナダドル",CHF:"スイスフラン",
  CNY:"中国人民元",KRW:"韓国ウォン",HKD:"香港ドル",SGD:"シンガポールドル",TWD:"台湾ドル",THB:"タイバーツ",
  INR:"インドルピー",IDR:"ルピア",PHP:"フィリピンペソ",MYR:"マレーシアリンギット",VND:"ベトナムドン",
  NZD:"ニュージーランドドル",BRL:"ブラジルレアル",ZAR:"南アフリカランド",PLN:"ポーランドズロチ",
  SEK:"スウェーデンクローナ",NOK:"ノルウェークローネ",DKK:"デンマーククローネ",TRY:"トルコリラ",MXN:"メキシコペソ",
  COP:"コロンビアペソ",ARS:"アルゼンチンペソ",CLP:"チリペソ",PEN:"ペルーソル",AED:"UAEディルハム",
  SAR:"サウジリヤル",ILS:"イスラエルシェケル"};
  return m[up(code)]||code;
}
