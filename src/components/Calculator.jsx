// src/components/Calculator.jsx
import React, { useState } from "react";

/**
 * 常時ポップアップの電卓
 * - 適用先は親側（App）のアクティブブロックに自動連動
 * - amount / setAmount に直に反映されます
 */
export default function Calculator({ amount, setAmount, activeLabel = "ブロック①" }) {
  const [input, setInput] = useState(String(amount ?? ""));

  // ブロック切り替え時に金額を同期（必要に応じて手動で更新）
  React.useEffect(() => {
    setInput(String(amount ?? ""));
  }, [amount]);

  const handleClick = (v) => {
    if (v === "C") return setInput("");
    if (v === "=") {
      try {
        // 安全な eval 代替
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
    setInput((prev) => (prev === "エラー" ? String(v) : prev + String(v)));
  };

  const buttons = [
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "C",
    "+",
    "=",
  ];

  return (
    <div style={styles.wrap} className="calc-sheet" onClick={(e) => e.stopPropagation()}>
      <div style={styles.header}>電卓（適用先：{activeLabel}）</div>

      <input
        style={styles.display}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="式を入力（例: 100*1.1）"
      />

      <div style={styles.grid}>
        {buttons.map((b) => (
          <button key={b} style={styles.btn} onClick={() => handleClick(b)}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    width: "280px",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    boxShadow: "0 12px 30px rgba(0,0,0,.18)",
    padding: "12px",
    zIndex: 9999,
  },
  header: {
    fontWeight: 700,
    marginBottom: "6px",
    fontSize: ".95rem",
  },
  display: {
    width: "100%",
    padding: "10px",
    fontSize: "1.1rem",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
  },
  btn: {
    padding: "10px 0",
    fontSize: "1rem",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    cursor: "pointer",
  },
};
