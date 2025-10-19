import React, { useEffect, useState } from "react";
import { fetchRate, getCurrencyNameJa } from "../api/rates.js";

const CODES = ["USD","JPY","EUR","GBP","AUD","CAD","CHF","CNY","HKD","KRW","MXN","TWD","SGD","NZD"];

export default function Converter({ calcValue }) {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("JPY");
  const [amount, setAmount] = useState(1);
  const [rate, setRate] = useState(0);
  const [date, setDate] = useState("");

  useEffect(()=>{ if(calcValue!=null) setAmount(calcValue); },[calcValue]);
  useEffect(()=>{
    let alive = true;
    (async()=>{
      const r = await fetchRate(from,to);
      if(!alive) return;
      setRate(r.rate||0);
      setDate(r.date||"");
    })();
    return ()=>{ alive=false; };
  },[from,to]);

  const result = Number.isFinite(rate) ? (amount*rate) : 0;

  return (
    <div className="card">
      <div className="row">
        <label className="visually-hidden" htmlFor="from">変換元</label>
        <select id="from" value={from} onChange={(e)=>setFrom(e.target.value)}>
          {CODES.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>

        <input
          type="number"
          value={amount}
          onChange={(e)=>setAmount(parseFloat(e.target.value)||0)}
          inputMode="decimal"
          aria-label="金額"
        />

        <div aria-hidden>→</div>

        <label className="visually-hidden" htmlFor="to">変換先</label>
        <select id="to" value={to} onChange={(e)=>setTo(e.target.value)}>
          {CODES.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="rate-line">
        1 {from} = <b>{rate ? rate.toFixed(6) : "--"}</b> {to}<br/>
        {amount} {from} = <b>{rate ? result.toFixed(6) : "--"}</b> {to}
      </div>
      <div className="rate-date">基準日: {date || "--"}</div>
      <div className="small-muted">{from} — {getCurrencyNameJa(from)} / {to} — {getCurrencyNameJa(to)}</div>
    </div>
  );
}
