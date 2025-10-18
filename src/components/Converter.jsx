// src/components/Converter.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getCurrencyNameJa, fetchPairRate } from "../api/rates.js";

/**
 * Converter
 * - クリックで onActivate(id) を呼び出して「電卓の適用先」を切替
 * - amount/setAmount が来たらそれを優先（来なければローカルstate）
 * - 入力のたびに即時計算（リアルタイム）
 */
export default function Converter({
  id,
  title = "通貨換算",
  defaultBase = "USD",
  defaultTarget = "JPY",
  amount,
  setAmount,
  isActive,
  onActivate,
}) {
  const [base, setBase] = useState(defaultBase);
  const [target, setTarget] = useState(defaultTarget);
  const [localAmount, setLocalAmount] = useState(amount || 1);
  const [rate, setRate] = useState(null);
  const [date, setDate] = useState(null);
  const [error, setError] = useState(null);

  const activeAmount = amount ?? localAmount;

  const handleActivate = () => {
    if (onActivate) onActivate(id);
  };

  // 数値入力イベント
  const handleChange = (e) => {
    const v = e.target.value;
    if (setAmount) setAmount(v);
    else setLocalAmount(v);
  };

  // レート取得
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetchPairRate(base, target);
        if (!ignore) {
          if (res.rate) {
            setRate(res.rate);
            setDate(res.date);
            setError(null);
          } else {
            setRate(null);
            setError(res.error || "レートを取得できませんでした");
          }
        }
      } catch (e) {
        if (!ignore) {
          setError("レートを取得できませんでした");
          setRate(null);
        }
      }
    }
    load();
    return () => { ignore = true; };
  }, [base, target]);

  const converted = useMemo(() => {
    const n = parseFloat(activeAmount);
    if (!rate || isNaN(n)) return "";
    return (n * rate).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [activeAmount, rate]);

  const currencyLabel = (c) => `${c} — ${getCurrencyNameJa(c)}`;

  return (
    <div
      className={`card ${isActive ? "active" : ""}`}
      data-active={isActive}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
    >
      <div className="row">
        <select
          value={base}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setBase(e.target.value)}
        >
          {[
            "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","HKD","KRW",
            "MXN","TWD","SGD","NZD","SEK","NOK","DKK","PLN","CZK","HUF",
            "TRY","THB","IDR","INR","PHP","MYR","ZAR","BRL","ILS","AED",
            "SAR","CLP","COP","ARS","PEN","VND"
          ].map((c) => (
            <option key={c} value={c}>{currencyLabel(c)}</option>
          ))}
        </select>

        <input
          type="number"
          value={activeAmount}
          onClick={(e) => e.stopPropagation()}
          onChange={handleChange}
        />

        <span style={{ fontSize: "1.4rem" }}>→</span>

        <select
          value={target}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setTarget(e.target.value)}
        >
          {[
            "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","HKD","KRW",
            "MXN","TWD","SGD","NZD","SEK","NOK","DKK","PLN","CZK","HUF",
            "TRY","THB","IDR","INR","PHP","MYR","ZAR","BRL","ILS","AED",
            "SAR","CLP","COP","ARS","PEN","VND"
          ].map((c) => (
            <option key={c} value={c}>{currencyLabel(c)}</option>
          ))}
        </select>
      </div>

      <div className="rate-line">
        {error ? (
          <span style={{ color: "#dc2626" }}>{error}</span>
        ) : rate ? (
          <>
            1 {base} = <b>{rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}</b> {target}
            <br />
            {activeAmount} {base} = <b>{converted}</b> {target}
          </>
        ) : (
          "レートを取得できませんでした"
        )}
      </div>

      {date && (
        <div className="rate-date">基準日: {new Date(date).toUTCString()}</div>
      )}
    </div>
  );
}
