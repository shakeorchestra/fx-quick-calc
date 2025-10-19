// src/App.jsx
import React, { useState } from "react";
import Converter from "./components/Converter";
import Calculator from "./components/Calculator";
import "./styles.css";

export default function App() {
  const [amountA, setAmountA] = useState(1);
  const [amountB, setAmountB] = useState(1);
  const [active, setActive] = useState("A"); // 'A' | 'B'

  const activeLabel = active === "A" ? "①" : "②";
  const activeAmount = active === "A" ? amountA : amountB;
  const activeSetter = active === "A" ? setAmountA : setAmountB;

  return (
    <main className="layout">
      <h1 className="title">鮭オーケストラの外貨パッと計算</h1>

      {/* 左カラム：カード2枚 */}
      <section className="cards">
        <Converter
          id="A"
          amount={amountA}
          setAmount={setAmountA}
          isActive={active === "A"}
          onActivate={setActive}
          defaultBase="JPY"
          defaultTarget="USD"
        />
        <Converter
          id="B"
          amount={amountB}
          setAmount={setAmountB}
          isActive={active === "B"}
          onActivate={setActive}
          defaultBase="USD"
          defaultTarget="JPY"
        />
      </section>

      {/* 右カラム：電卓（横並び） */}
      <aside className="side">
        <Calculator amount={activeAmount} setAmount={activeSetter} activeLabel={activeLabel} />
      </aside>
    </main>
  );
}
