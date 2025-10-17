// src/api/rates.js
// 鮭オーケストラの外貨パット計算アプリ用
// 自前の /api/quote サーバー経由でレートを取得します

export async function fetchPairRate(base, target) {
  try {
    const res = await fetch(`/api/quote?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json(); // { rate:number|null, date:string }
    return data;
  } catch (e) {
    console.error("fetchPairRate error:", e);
    return { rate: null, date: "" };
  }
}
