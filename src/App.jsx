import React, { useState } from "react";
import Converter from "./components/Converter.jsx";
import Calculator from "./components/Calculator.jsx";

export default function App() {
  const [calcValue, setCalcValue] = useState(1);

  return (
    <div className="layout">
      <h1 className="title">鮭オーケストラの外貨パッと計算</h1>

      {/* カード1 */}
      <div className="cards">
        <Converter calcValue={calcValue} />
        {/* カード2：独立インスタンス（必要なら残す） */}
        <Converter />
      </div>

      {/* 電卓 */}
      <div className="side">
        <Calculator onInput={setCalcValue} />
      </div>
    </div>
  );
}
