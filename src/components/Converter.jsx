import React, { useEffect, useMemo, useState } from "react";
import { fetchPairRate } from "../api/rates.js";

/**
 * カード型コンバータ（枠あり・サイズ指定・カンマ整形）
 */
export default function Converter({
  id,
  defaultBase = "USD",
  defaultTarget = "JPY",
  amount,
  setAmount,
  isActive,
  onActivate,
}) {
  const [base, setBase] = useState(defaultBase);
  const [target, setTarget] = useState(defaultTarget);
  const [localAmount, setLocalAmount] = useState(amount ?? 1);
  const [rate, setRate] = useState(null);
  const [date, setDate] = useState(null);
  const [error, setError] = useState(null);

  const activeAmount = amount ?? localAmount;

  // カンマ付き表示値
  const displayAmount = useMemo(() => {
    const v = Number.isFinite(activeAmount) ? activeAmount : 0;
    return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [activeAmount]);

  // レート取得
  useEffect(() => {
    let mounted = true;
    fetchPairRate(base, target)
      .then((res) => {
        if (!mounted) return;
        setRate(res.rate);
        setDate(res.date);
        setError(null);
      })
      .catch((e) => {
        if (!mounted) return;
        console.error(e);
        setError("レート取得に失敗しました");
      });
    return () => {
      mounted = false;
    };
  }, [base, target]);

  // 入力（カンマ除去→数値）
  const onAmountChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    const num = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(num)) return;
    if (setAmount) setAmount(num);
    else setLocalAmount(num);
  };

  const converted = useMemo(() => {
    if (!rate) return "";
    const v = activeAmount * rate;
    return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [activeAmount, rate]);

  const CURRENCIES = [
    "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","HKD","KRW","MXN","TWD","SGD","NZD","SEK","NOK","DKK","PLN","CZK","HUF","TRY","THB","IDR","INR","PHP","MYR","ZAR","BRL","ILS","AED","SAR","CLP","COP","ARS","PEN","VND"
  ];

  return (
    <div
      className={`conv-card${isActive ? " conv-card--active" : ""}`}
      onClick={() => onActivate && onActivate(id)}
    >
      {/* 変換元 */}
      <label className="conv-label">変換元</label>
      <div className="conv-row">
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="conv-select"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          inputMode="decimal"
          value={displayAmount}
          onChange={onAmountChange}
          className="conv-amount"
          placeholder="0"
        />

        <span className="conv-arrow">→</span>
      </div>

      {/* 変換先 */}
      <label className="conv-label mt">変換先</label>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="conv-select"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* 結果 */}
      {rate && (
        <div className="conv-result">
          1 {base} = {rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {target}
          <br />
          {displayAmount} {base} = <span className="conv-highlight">{converted}</span> {target}
        </div>
      )}
      {error && <div className="conv-error">{error}</div>}
      {date && <div className="conv-date">基準日: {new Date(date).toUTCString()}</div>}
    </div>
  );
}
