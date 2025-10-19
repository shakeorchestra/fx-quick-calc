// src/components/Calculator.jsx
import React, { useState } from "react";

export default function Calculator({ onInput }) {
  const [display, setDisplay] = useState("0");   // 画面表示（式も表示）
  const [acc, setAcc] = useState(null);          // 蓄積値
  const [op, setOp] = useState(null);            // 現在の演算子
  const [entering, setEntering] = useState(true);// 数字入力中か

  const fmt = (v) => (Number.isFinite(v) ? String(v) : "0");

  const commit = (a, b, oper) => {
    if (a == null) return b ?? 0;
    if (b == null) return a ?? 0;
    if (oper === "+") return a + b;
    if (oper === "−") return a - b;
    if (oper === "×") return a * b;
    if (oper === "÷") return b === 0 ? 0 : a / b; // 0除算→0
    return b;
  };

  const pushDigit = (d) => {
    if (!entering || display === "0") setDisplay(String(d));
    else setDisplay(display + d);
    setEntering(true);
  };

  const pushDot = () => {
    if (!entering) { setDisplay("0."); setEntering(true); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const doPercent = () => {
    const v = parseFloat(display) || 0;
    const p = v / 100;
    setDisplay(fmt(p));
    if (onInput) onInput(p);
  };

  const doBackspace = () => {
    if (!entering) return;
    const s = display.length > 1 ? display.slice(0, -1) : "0";
    setDisplay(s);
  };

  const applyOp = (nextOp) => {
    const cur = parseFloat(display);
    if (op == null) {
      // まだ演算子なし → acc に取り込む
      setAcc(Number.isFinite(cur) ? cur : 0);
    } else if (entering) {
      // 中間確定（例: 9×3 の入力直後に + を押す → 27 を確定）
      const res = commit(acc ?? 0, Number.isFinite(cur) ? cur : 0, op);
      setAcc(res);
      setDisplay(fmt(res));
      if (onInput) onInput(res);
    }
    setOp(nextOp);
    setEntering(false);
  };

  const doEnter = () => {
    const cur = parseFloat(display);
    const res = commit(acc ?? 0, Number.isFinite(cur) ? cur : 0, op);
    setAcc(null);
    setOp(null);
    setDisplay(fmt(res));
    setEntering(false);
    if (onInput) onInput(res);
  };

  const handleClick = (val) => {
    if (val === "AC") { setDisplay("0"); setAcc(null); setOp(null); setEntering(true); return; }
    if (val === "⌫") { doBackspace(); return; }
    if (val === ".") { pushDot(); return; }
    if (val === "%") { doPercent(); return; }
    if (val === "⏎") { doEnter(); return; }

    if (["÷","×","−","+"].includes(val)) { applyOp(val); return; }
    // 数字
    if (/^\d$/.test(val)) { pushDigit(val); return; }
  };

  // 画面上の式表示用
  const exprHead = op && acc != null && entering ? `${fmt(acc)}${op}` :
                   op && acc != null && !entering ? `${fmt(acc)}${op}` : "";

  const buttons = [
    "AC","±","%","÷",
    "7","8","9","×",
    "4","5","6","−",
    "1","2","3","+",
    "0",".","⌫","⏎",
  ];

  // ± は直近入力に対して符号反転
  const toggleSign = () => {
    const v = parseFloat(display) || 0;
    const s = fmt(-v);
    setDisplay(s);
    if (onInput) onInput(parseFloat(s) || 0);
  };

  return (
    <div className="calc-sheet">
      <div className="calc-head" style={{opacity:.8, fontSize:12}}>
        {exprHead}
      </div>
      <input className="calc-display" value={display} readOnly />
      <div className="calc-grid">
        {buttons.map((b) => (
          <button
            key={b}
            className={`btn ${"÷×−+".includes(b) ? "op" : ""}`}
            onClick={() => b==="±" ? toggleSign() : handleClick(b)}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
