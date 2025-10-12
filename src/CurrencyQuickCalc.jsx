import React, { useEffect, useMemo, useState } from 'react'

const CURRENCIES = [
  'USD','JPY','EUR','GBP','AUD','CAD','CHF','CNY','HKD','KRW','MXN','TWD','SGD','NZD','SEK','NOK','DKK','PLN','CZK','HUF','TRY','THB','IDR','INR','PHP','MYR','ZAR','BRL','ILS','AED','SAR','CLP','COP','ARS','PEN','VND'
]

const numberFmt = (v, currency) => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v) }
  catch { return new Intl.NumberFormat().format(v) }
}

function useDebounced(value, delay = 300){
  const [debounced, setDebounced] = useState(value)
  useEffect(()=>{ const id=setTimeout(()=>setDebounced(value), delay); return ()=>clearTimeout(id)}, [value, delay])
  return debounced
}

export default function CurrencyQuickCalc(){
  const [base, setBase] = useState('USD')
  const [quote, setQuote] = useState('JPY')
  const [amount, setAmount] = useState('100')
  const [rates, setRates] = useState({})
  const [lastUpdated, setLastUpdated] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedAmount = useDebounced(amount)

  const fetchRates = async (from) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}`)
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRates(data.rates || {})
      setLastUpdated(data.date || '')
    } catch (e){
      console.error(e)
      setError('レート取得に失敗しました。ネット接続とAPIの状態をご確認ください。')
    } finally { setLoading(false) }
  }
  useEffect(()=>{ fetchRates(base) }, [base])

  const rate = useMemo(()=>{
    if(quote === base) return 1
    return rates[quote]
  }, [rates, quote, base])

  const converted = useMemo(()=>{
    const a = parseFloat(String(debouncedAmount).replace(/,/g,''))
    if(!isFinite(a) || !rate) return 0
    return a * rate
  }, [debouncedAmount, rate])

  const swap = () => { const prevBase = base; setBase(quote); setQuote(prevBase) }
  const allCodes = useMemo(()=> Array.from(new Set([base, quote, ...CURRENCIES])).sort(), [base, quote])

  return (
    <div>
      <div className="grid grid-2">
        <div>
          <label>金額 ({base})</label>
          <input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100"/>
        </div>
        <div>
          <label>結果 ({quote})</label>
          <div className="output">{rate ? numberFmt(converted, quote) : '--'}</div>
        </div>
      </div>
      <div className="grid grid-3" style={{marginTop:12}}>
        <div>
          <label>変換元</label>
          <select value={base} onChange={e=>setBase(e.target.value)}>
            {allCodes.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="row">
          <button className="btn" onClick={swap}>⇄ 入れ替え</button>
        </div>
        <div>
          <label>変換先</label>
          <select value={quote} onChange={e=>setQuote(e.target.value)}>
            {allCodes.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="small" style={{marginTop:8}}>
        <div>{loading ? 'レート更新中…' : rate ? `レート: 1 ${base} = ${rate?.toLocaleString?.() || rate} ${quote}` : 'レート未取得'}</div>
        {lastUpdated && <div>基準日: {lastUpdated} (ECB)</div>}
        {error && <div className="small error">{error}</div>}
      </div>
      <div className="chips" style={{marginTop:16}}>
        {[
          ['USD','JPY'],['JPY','USD'],['USD','EUR'],['EUR','USD'],
          ['USD','KRW'],['USD','MXN'],['USD','TWD'],['USD','THB'],
        ].map(([b,q])=> (
          <button key={`${b}-${q}`} className="btn" onClick={()=>{ setBase(b); setQuote(q); }}>
            {b}→{q}
          </button>
        ))}
      </div>
      <p className="small" style={{marginTop:12}}>注意: 無料APIのため実レートと数分の遅延・提示スプレッド差があります。送金や会計には必ず金融機関のレートで再確認してください。</p>
    </div>
  )
}
