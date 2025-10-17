// src/components/Converter.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchPairRate, getCurrencyNameJa } from "../api/rates";

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
  amount: amountProp,
  setAmount: setAmountProp,
  isActive = false,
  onActivate,
}) {
  // 適用先切替（クリック）
  const handleActivate = () => onActivate && onActivate(id);

  // 通貨選択
  const [base, setBase] = useState(defaultBase);
  const [target, setTarget] = useState(defaultTarget);

  // 親から来なければ自前state（＝ブロック間は連動しない）
  const [amountLocal, setAmountLocal] = useState(1);
  const amount = amountProp ?? amountLocal;
  const setAmount = setAmountProp ?? setAmountLocal;

  // レート取得
  const [rate, setRate] = useState(null);
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { rate, date } = await fetchPairRate(base, target);
      if (!alive) return;
      setRate(rate ?? null);
      setTimestamp(date || "");
    })();
    return () => { alive = false; };
  }, [base, target]);

  const converted = useMemo(() => {
    const n = parseFloat(amount || 0);
    if (!rate || Number.isNaN(n)) return "—";
    return (n * rate).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, rate]);

  // 表示用通貨リスト（COP あり）
  const allCodes = useMemo(
    () => [
      "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","KRW","MXN",
      "BRL","INR","RUB","SGD","HKD","TWD","THB","SEK","NOK","DKK",
      "ZAR","PLN","CZK","HUF","RON","TRY","IDR","ILS","PHP","MYR",
      "NZD","COP",
    ],
    []
  );

  const frameStyle = {
    ...styles.card,
    border: isActive ? "2px solid #4f46e5" : "1px solid #eee",
    boxShadow: isActive ? "0 0 0 4px rgba(79,70,229,.15)" : styles.card.boxShadow,
    cursor: "pointer",
  };

  return (
    <div style={frameStyle} className="card" onClick={handleActivate} role="button" tabIndex={0}>
      {/* タイトルは非表示にしておく場合はコメントのまま */}
      {/* <h2 style={{ marginTop: 0 }}>{title}{isActive ? "（適用先）" : ""}</h2> */}

      <div style={styles.row} onClick={(e) => e.stopPropagation()}>
        <select value={base} onChange={(e) => setBase(e.target.value)} style={styles.select}>
          {allCodes.map((c) => (
            <option key={c} value={c}>
              {c} — {getCurrencyNameJa(c)}
            </option>
          ))}
        </select>

        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />

        <span style={{ fontSize: "1.4rem", padding: "0 .5rem" }}>→</span>

        <select value={target} onChange={(e) => setTarget(e.target.value)} style={styles.select}>
          {allCodes.map((c) => (
            <option key={c} value={c}>
              {c} — {getCurrencyNameJa(c)}
            </option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: "1.6rem", margin: "0.5rem 0 0" }}>
        1 {base} = <strong>{rate ? rate.toLocaleString() : "—"}</strong> {target}
      </p>
      <p style={{ fontSize: "2rem", margin: "0.25rem 0 0" }}>
        {amount || 0} {base} = <strong>{converted}</strong> {target}
      </p>

      {/* 最終更新を出したいときだけ表示 */}
      {/* <p style={{ fontSize: ".85rem", color: "#888", marginTop: ".6rem" }}>
        最終更新: {timestamp || "取得中…"}
      </p> */}
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "1rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 14px rgba(0,0,0,.08)",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr auto 1.2fr",
    alignItems: "center",
    gap: ".6rem",
    marginTop: ".5rem",
  },
  select: {
    width: "100%",
    padding: ".7rem .8rem",
    borderRadius: ".6rem",
    border: "1px solid #ddd",
    background: "white",
  },
  input: {
    width: "100%",
    padding: ".7rem .8rem",
    borderRadius: ".6rem",
    border: "1px solid #ddd",
    textAlign: "right",
  },
};
