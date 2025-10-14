// src/App.jsx
import React, { useState } from "react";
import Converter from "./components/Converter";
import Calculator from "./components/Calculator";

export default function App() {
  // ブロックごとの金額（独立）
  const [amountA, setAmountA] = useState(1);
  const [amountB, setAmountB] = useState(1);

  // どのブロックが現在の適用先か
  const [active, setActive] = useState("A"); // 'A' | 'B'

  const activeLabel = active === "A" ? "①" : "②"; // ←電卓用の簡略表示
  const activeAmount = active === "A" ? amountA : amountB;
  const activeSetter = active === "A" ? setAmountA : setAmountB;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>鮭オーケストラの外貨パッと計算</h1>

      <div style={styles.grid} className="app-grid">
        <Converter
          id="A"
          amount={amountA}
          setAmount={setAmountA}
          isActive={active === "A"}
          onActivate={setActive}
          defaultBase="USD"
          defaultTarget="JPY"
        />
        <Converter
          id="B"
          amount={amountB}
          setAmount={setAmountB}
          isActive={active === "B"}
          onActivate={setActive}
          defaultBase="JPY"
          defaultTarget="EUR"
        />
      </div>

      {/* 常時ポップアップの電卓：アクティブのブロックに反映 */}
      <Calculator amount={activeAmount} setAmount={activeSetter} activeLabel={activeLabel} />

      <p style={styles.footer}>
        データ提供: Frankfurter API（約60秒ごとに自動更新）
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "2rem auto",
    padding: "1rem",
    fontFamily: "Arial, sans-serif",
  },
  title: { textAlign: "center" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  footer: {
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#777",
    marginTop: "2rem",
  },
};
