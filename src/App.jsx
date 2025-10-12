import React from 'react'
import CurrencyQuickCalc from './CurrencyQuickCalc.jsx'
export default function App() {
  return (
    <div className="container">
      <h1>外貨パッと計算</h1>
      <p className="muted">ECBベースの最新レート（Frankfurter API）を使用。キー不要で今すぐ使えます。</p>
      <CurrencyQuickCalc/>
    </div>
  )
}
