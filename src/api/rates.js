// src/api/rates.js

// Frankfurter からレート取得
export async function fetchRates(base = "USD") {
  const res = await fetch(`https://api.frankfurter.app/latest?base=${base}`);
  if (!res.ok) throw new Error("為替APIエラー");
  const data = await res.json();
  return data; // { base, date, rates: { JPY: xxx, EUR: xxx, ... } }
}

// 通貨コード -> 日本語名（必要なら随時追加OK）
export const currencyNamesJa = {
  USD: "米ドル",
  JPY: "日本円",
  EUR: "ユーロ",
  GBP: "英ポンド",
  AUD: "豪ドル",
  CAD: "カナダドル",
  CHF: "スイスフラン",
  CNY: "中国人民元",
  KRW: "韓国ウォン",
  MXN: "メキシコペソ",
  BRL: "ブラジルレアル",
  INR: "インドルピー",
  RUB: "ロシアルーブル",
  HKD: "香港ドル",
  TWD: "台湾ドル",
  THB: "タイバーツ",
  SEK: "スウェーデンクローナ",
  NOK: "ノルウェークローネ",
  DKK: "デンマーククローネ",
  ZAR: "南アフリカランド",
  COP: "コロンビアペソ", // 追加
};

// 日本語名取得（未登録ならコードをそのまま返す）
export function getCurrencyNameJa(code) {
  return currencyNamesJa[code] ?? code;
}
