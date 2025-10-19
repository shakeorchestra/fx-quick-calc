// src/components/Converter.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getCurrencyNameJa, fetchPairRate } from "../api/rates.js";

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

  // 画面幅でモバイル判定（PCはfalseのまま）
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 480px)").matches;

  const activeAmount = amount ?? localAmount;

  const handleActivate = () => {
    onActivate && onActivate(id);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setAmount ? setAmount(v) : setLocalAmount(v);
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetchPairRate(base, target);
        if (ignore) return;
        if (res.rate) {
          setRate(res.rate);
          setDate(res.date);
          setError(null);
        } else {
          setRate(null);
          setError(res.error || "レートを取得できませんでした");
        }
      } catch {
        if (!ignore) {
          setError("レートを取得できませんでした");
          setRate(null);
        }
      }
    })();
    return () => {
      ignore = true;
    };
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
          // スマホだけキーボード抑止（PCはそのまま）
          readOnly={isMobile}
          inputMode={isMobile ? "none" : "decimal"}
          onFocus={isMobile ? (e) => e.target.blur() : undefined}
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
