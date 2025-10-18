// src/components/Calculator.jsx
import React, { useEffect, useState } from "react";

/**
 * 常時表示の電卓（横並び用）
 * - 適用先は親側（App）のアクティブブロックに自動連動
 * - amount / setAmount に直に反映
 */
export default function Calculator({ amount, setAmount, activeLabel = "ブロック①" }) {
  const [input, setInput] = useState(String(amount ?? ""));

  useEffect(() => {
    setInput(String(amount ?? ""));
  }, [amount]);

  const handleClick = (v) => {
    if (v === "AC") return setInput("");
    if (v === "=") {
      try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict";return (${input || 0})`)();
        const text = String(result ?? "");
        setInput(text);
        setAmount(text);
      } catch {
        setInput("エラー");
      }
      return;
    }
    if (v === "±") return setInput((p) => (p ? String(-Number(p)) : ""));
    setInput((prev) => (prev === "エラー" ? String(v) : prev + String(v)));
  };

  const keys = [
    ["AC", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  // 演算子の置換（見た目を保ちつつ eval ではなく Function で計算）
  const opMap = { "×": "*", "÷": "/", "−": "-" };
  useEffect(() => {
    // 入力時は見た目の記号のままでOK。計算 "=" で JS 記号に置換して評価します。
  }, []);

  const click = (label) => {
    if (label === "=") {
      try {
        const expr = input.replace(/[×÷−]/g, (m) => opMap[m] || m);
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict";return (${expr || 0})`)();
        const text = String(result ?? "");
        setInput(text);
        setAmount(text);
      } catch {
        setInput("エラー");
      }
      return;
    }
    handleClick(label);
  };

  return (
    <div className="calc-sheet">
      <div className="calc-head">電卓（適用先：{activeLabel}）</div>
      <input
        className="calc-display"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="0"
      />

      <div className="calc-grid">
        {keys.slice(0, 4).flat().map((k) => (
          <button key={k} className={`btn ${"÷×−+".includes(k) ? "op" : ""}`} onClick={() => click(k)}>
            {k}
          </button>
        ))}
        {/* 最下段だけ 0 をワイドに */}
        <button className="btn span-2" onClick={() => click("0")}>0</button>
        <button className="btn" onClick={() => click(".")}>.</button>
        <button className="btn op" onClick={() => click("=")}>=</button>
      </div>
    </div>
  );
}
