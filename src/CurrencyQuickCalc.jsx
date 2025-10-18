// src/CurrencyQuickCalc.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getCurrencyNameJa, fetchPairRate } from "./api/rates.js";

/** 見た目は3文字コード、クリックするとネイティブの選択肢（"USD — 米ドル"）が開く */
function CurrencySelect({ value, onChange, codes }) {
  return (
    <div className="cc-select">
      <div className="cc-pill">{value}</div>
      <select
        className="cc-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="通貨を選択"
      >
        {codes.map((c) => (
          <option key={c} value={c}>
            {c} — {getCurrencyNameJa(c)}
          </option>
        ))}
      </select>
    </div>
  );
}

const CURRENCIES = [
  "USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","HKD","KRW","MXN","TWD","SGD","NZD",
  "SEK","NOK","DKK","PLN","CZK","HUF","TRY","THB","IDR","INR","PHP","MYR","ZAR","BRL",
  "ILS","AED","SAR","CLP","COP","ARS","PEN","VND"
];

const numberFmt = (v, currency) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
  } catch {
    return new Intl.NumberFormat().format(v);
  }
};

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function CurrencyQuickCalc() {
  const [base, setBase] = useState("USD");
  const [quote, setQuote] = useState("JPY");
  const [amount, setAmount] = useState("100");
  const [rate, setRate] = useState(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedAmount = useDebounced(amount);

  const allCodes = useMemo(
    () => Array.from(new Set([base, quote, ...CURRENCIES])).sort(),
    [base, quote]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { rate: r, date: d } = await fetchPairRate(base, quote);
        if (!alive) return;
        if (typeof r === "number" && isFinite(r)) {
          setRate(r);
          setDate(d || "");
        } else {
          setRate(null);
          setError("レートを取得できませんでした");
        }
      } catch {
        if (!alive) return;
        setRate(null);
        setError("通信エラー");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [base, quote]);

  const converted = useMemo(() => {
    const a = parseFloat(String(debouncedAmount).replace(/,/g, ""));
    if (!isFinite(a) || typeof rate !== "number") return 0;
    return a * rate;
  }, [debouncedAmount, rate]);

  const swap = () => {
    const b = base; setBase(quote); setQuote(b);
  };

  return (
    <div>
      <div className="grid grid-2">
        <div>
          <label>金額 ({base} — {getCurrencyNameJa(base)})</label>
          <input
            className="amount-input"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            aria-label="金額を入力"
          />
        </div>
        <div>
          <label>結果 ({quote} — {getCurrencyNameJa(quote)})</label>
          <div className="output">
            {typeof rate === "number" ? numberFmt(converted, quote) : "--"}
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 12 }}>
        <div>
          <label>変換元</label>
          <CurrencySelect value={base} onChange={setBase} codes={allCodes} />
        </div>

        <div className="row">
          <button className="btn" onClick={swap}>⇄ 入れ替え</button>
        </div>

        <div>
          <label>変換先</label>
          <CurrencySelect value={quote} onChange={setQuote} codes={allCodes} />
        </div>
      </div>

      <div className="small" style={{ marginTop: 8 }}>
        <div>
          {loading
            ? "レート更新中…"
            : typeof rate === "number"
              ? `レート: 1 ${base} = ${rate?.toLocaleString?.() || rate} ${quote}`
              : "レート未取得"}
        </div>
        {date && <div>基準日: {date}</div>}
        {error && <div className="small error">{error}</div>}
      </div>

      <div className="chips" style={{ marginTop: 16 }}>
        {[
          ["USD", "JPY"], ["JPY", "USD"], ["USD", "EUR"], ["EUR", "USD"],
          ["USD", "KRW"], ["USD", "MXN"], ["USD", "TWD"], ["USD", "THB"],
        ].map(([b, q]) => (
          <button key={`${b}-${q}`} className="btn" onClick={() => { setBase(b); setQuote(q); }}>
            {b}→{q}
          </button>
        ))}
      </div>

      {/* ※ リクエストに沿い「データ提供: Frankfurter…」の表示は削除しました */}
    </div>
  );
}
