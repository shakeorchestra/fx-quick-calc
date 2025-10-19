// src/components/Calculator.jsx
import React, { useEffect, useState } from "react"

export default function Calculator({ amount, setAmount, activeLabel }) {
  const [input, setInput] = useState("0")
  const [justEvaluated, setJustEvaluated] = useState(false)

  // 外側の金額が変わったら画面に同期（UIのみ。計算状態は壊さない）
  useEffect(() => {
    if (amount != null && !justEvaluated) {
      setInput(String(amount))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount])

  // --- % 前処理 ---
  const preprocessPercent = (expr) => {
    let s = expr
    s = s.replace(/([*/])\s*(\d+(?:\.\d+)?)%/g, (_, op, b) => `${op}(${b}/100)`)
    s = s.replace(
      /(\d+(?:\.\d+)?)(\s*[+\-]\s*)(\d+(?:\.\d+)?)%/g,
      (_, a, op, b) => `${a}${op}(${a}*${b}/100)`
    )
    return s
  }

  const append = (val) => {
    setInput((prev) => {
      const base = justEvaluated && /[0-9.]/.test(val) ? "" : prev
      const next = base === "0" && /[0-9]/.test(val) ? val : base + val
      setJustEvaluated(false)
      return next
    })
  }

  const clearAll = () => {
    setInput("0")
    setJustEvaluated(false)
  }

  const toggleSign = () => {
    setInput((prev) => {
      const m = prev.match(/(-?\d+(\.\d+)?)$/)
      if (!m) return prev
      const n = parseFloat(m[1]) * -1
      return prev.slice(0, prev.length - m[1].length) + String(n)
    })
  }

  const evaluate = () => {
    try {
      const expr = input.replace(/×/g, "*").replace(/÷/g, "/")
      if (!/^[0-9+\-*/().%\s]+$/.test(expr)) throw new Error("invalid")
      // eslint-disable-next-line no-eval
      const v = eval(preprocessPercent(expr))
      const out = String(v)
      setInput(out)
      setJustEvaluated(true)
      // 親へ反映（矢印ボタン/＝押下時）
      if (typeof setAmount === "function") {
        const num = Number(v)
        if (Number.isFinite(num)) setAmount(num)
      }
    } catch {
      setInput("エラー")
      setJustEvaluated(true)
    }
  }

  // ---- 配置（デザインはそのまま）----
  const rows = [
    ["AC", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ]

  const root = {
    width: 360,
    background: "#0f172a",
    borderRadius: 18,
    padding: 12,
    color: "#e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  }
  const screenWrap = {
    background: "#0b1426",
    borderRadius: 12,
    padding: "14px 16px",
    margin: "6px 6px 12px",
    minHeight: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    fontSize: 34,
    fontWeight: 700,
    overflow: "hidden",
  }
  const grid = { display: "grid", gap: 12, padding: "0 6px 8px" }
  const rowStyle = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }
  const btn = {
    background: "#1f2937",
    border: "none",
    color: "#e5e7eb",
    borderRadius: 14,
    fontSize: 22,
    padding: "14px 0",
    cursor: "pointer",
  }
  const btnWide = { ...btn, gridColumn: "span 2" }
  const btnOp = { ...btn, background: "#f59e0b", color: "#111827" }
  const eqBtn = { ...btnOp }

  const onPress = (label) => {
    if (label === "AC") return clearAll()
    if (label === "±") return toggleSign()
    if (label === "%") return append("%")
    if (label === "=") return evaluate()
    if (label === "×") return append("*")
    if (label === "÷") return append("/")
    if (label === "−") return append("-")
    if (label === "+") return append("+")
    if (label === ".") return append(".")
    if (label === "0") return append("0")
    return append(label) // 数字
  }

  return (
    <div style={root}>
      <div aria-label="display" style={screenWrap}>
        {input}
      </div>

      <div style={grid}>
        {/* 1行目 */}
        <div style={rowStyle}>
          {rows[0].map((k) => (
            <button
              key={k}
              onClick={() => onPress(k)}
              style={k === "÷" ? btnOp : btn}
              aria-label={k}
              title={k}
            >
              {k}
            </button>
          ))}
        </div>

        {/* 2〜4行目 */}
        {[1, 2, 3].map((ri) => (
          <div style={rowStyle} key={ri}>
            {rows[ri].map((k, i) => (
              <button
                key={k + i}
                onClick={() => onPress(k)}
                style={i === 3 ? btnOp : btn}
                aria-label={k}
                title={k}
              >
                {k}
              </button>
            ))}
          </div>
        ))}

        {/* 最下段 0 . = */}
        <div style={rowStyle}>
          <button onClick={() => onPress("0")} style={btnWide} aria-label="0" title="0">
            0
          </button>
          <button onClick={() => onPress(".")} style={btn} aria-label="." title=".">
            .
          </button>
          <button onClick={() => onPress("=")} style={eqBtn} aria-label="Enter" title="Enter">
            {/* = を矢印に表示だけ変更 */}
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10.5l2.3 2.3-1.4 1.4L7 15.3l4.4-4.4 1.4 1.4L10.5 14H18V5H6v3H4V5Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
