import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

const PERIODS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
]

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${(n / 1e6).toFixed(2)}M`
}

export function CoinDetail() {
  const { id } = useParams<{ id: string }>()
  const chartRef = useRef<HTMLDivElement>(null)
  const [days, setDays] = useState(7)
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertDir, setAlertDir] = useState<'above' | 'below'>('above')
  const { prices, flash } = useWebSocket()
  const qc = useQueryClient()

  const { data: candles = [] } = useQuery({
    queryKey: ['history', id, days],
    queryFn: () => api.get(`/coins/${id}/history?days=${days}`).then(r => r.data),
  })

  const { data: coins = [] } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=100').then(r => r.data),
  })

  const coin = coins.find((c: any) => c.id === id)
  const wsPrice = coin ? prices[coin.symbol.toUpperCase() + 'USDT'] : null
  const currentPrice = wsPrice ? parseFloat(wsPrice) : coin?.current_price
  const change = coin?.price_change_percentage_24h ?? 0
  const isUp = change >= 0

  const addHolding = useMutation({
    mutationFn: () => api.post('/portfolio/', { coin_id: id, amount: parseFloat(amount), buy_price: parseFloat(buyPrice) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); setShowPortfolioForm(false); setAmount(''); setBuyPrice('') },
  })

  const addAlert = useMutation({
    mutationFn: () => api.post('/alerts/', { coin_id: coin?.symbol.toUpperCase() + 'USDT', target_price: parseFloat(alertPrice), direction: alertDir }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); setShowAlertForm(false); setAlertPrice('') },
  })

  useEffect(() => {
    if (!chartRef.current || !candles.length) return
    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(168,85,247,0.4)', labelBackgroundColor: '#7c3aed' },
        horzLine: { color: 'rgba(168,85,247,0.4)', labelBackgroundColor: '#7c3aed' },
      },
      width: chartRef.current.clientWidth,
      height: 380,
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4ade80',
      downColor: '#f87171',
      borderUpColor: '#4ade80',
      borderDownColor: '#f87171',
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    })
    series.setData(candles)
    chart.timeScale().fitContent()
    const resize = () => { if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }) }
    window.addEventListener('resize', resize)
    return () => { chart.remove(); window.removeEventListener('resize', resize) }
  }, [candles])

  const candleHigh = candles.length ? Math.max(...candles.map((c: any) => c.high)) : 0
  const candleLow = candles.length ? Math.min(...candles.map((c: any) => c.low)) : 0
  const priceInRange = candleHigh > candleLow && currentPrice
    ? ((currentPrice - candleLow) / (candleHigh - candleLow)) * 100
    : 50

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-purple-400 transition-colors">Market</Link>
        <span>›</span>
        <span className="text-gray-300">{coin?.name ?? id}</span>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {coin && (
              <div className="relative">
                <img src={coin.image} alt={coin.name} className="w-14 h-14 rounded-full ring-2 ring-white/10" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-900 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                  #{coins.findIndex((c: any) => c.id === id) + 1}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{coin?.name ?? id}</h1>
                <span className="text-gray-500 uppercase text-sm bg-white/5 px-2 py-0.5 rounded-lg">{coin?.symbol}</span>
              </div>
              {currentPrice && (
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`text-3xl font-mono font-bold px-2 py-0.5 rounded-lg transition-all ${
                    coin && flash[coin.symbol.toUpperCase() + 'USDT'] === 'up' ? 'flash-up' :
                    coin && flash[coin.symbol.toUpperCase() + 'USDT'] === 'down' ? 'flash-down' : ''
                  }`}>
                    ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: currentPrice < 1 ? 6 : 2 })}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                    isUp ? 'bg-green-500/10 price-up' : 'bg-red-500/10 price-down'
                  }`}>
                    {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowPortfolioForm(!showPortfolioForm); setShowAlertForm(false) }}
              className={`gradient-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showPortfolioForm ? 'opacity-70' : ''}`}>
              + Portfolio
            </button>
            <button onClick={() => { setShowAlertForm(!showAlertForm); setShowPortfolioForm(false) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                showAlertForm
                  ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-yellow-500/30 hover:text-yellow-300'
              }`}>
              ◉ Alert
            </button>
          </div>
        </div>

        {coin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Cap</p>
              <p className="font-semibold font-mono">{fmt(coin.market_cap)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">24h Volume</p>
              <p className="font-semibold font-mono">{fmt(coin.total_volume)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vol / MCap</p>
              <p className="font-semibold font-mono">
                {coin.market_cap > 0 ? ((coin.total_volume / coin.market_cap) * 100).toFixed(2) : '—'}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{days === 1 ? '24h' : `${days}D`} Range</p>
              {candleHigh > 0 && candleLow > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>${candleLow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span>${candleHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="relative h-1.5 bg-white/5 rounded-full">
                    <div className="absolute h-full rounded-full bg-gradient-to-r from-red-500 to-green-500 opacity-40" style={{ width: '100%' }} />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-purple-400 -top-0.5 -translate-x-1/2 shadow-lg"
                      style={{ left: `${priceInRange}%` }} />
                  </div>
                </div>
              ) : <p className="text-gray-600 text-xs">Loading...</p>}
            </div>
          </div>
        )}
      </div>

      {showPortfolioForm && (
        <div className="glass rounded-2xl p-5 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Add to Portfolio</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-gray-500 block mb-2">Amount</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.5"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-28 focus:outline-none focus:border-purple-500/50 transition-all" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-2">Buy Price ($)</label>
              <input value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                placeholder={currentPrice ? Math.round(currentPrice).toString() : '80000'}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-36 focus:outline-none focus:border-purple-500/50 transition-all" />
            </div>
            {amount && buyPrice && (
              <div className="text-xs text-gray-500 pb-2.5">
                = <span className="text-gray-300 font-medium">${(parseFloat(amount) * parseFloat(buyPrice)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <button onClick={() => addHolding.mutate()} disabled={!amount || !buyPrice}
              className="gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
              Add Holding
            </button>
          </div>
        </div>
      )}

      {showAlertForm && (
        <div className="glass rounded-2xl p-5 border border-yellow-500/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Set Price Alert</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-gray-500 block mb-2">Direction</label>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {(['above', 'below'] as const).map(d => (
                  <button key={d} onClick={() => setAlertDir(d)}
                    className={`px-4 py-2.5 text-sm font-medium transition-all ${
                      alertDir === d
                        ? d === 'above' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        : 'bg-white/5 text-gray-500 hover:text-gray-300'
                    }`}>
                    {d === 'above' ? '▲ Above' : '▼ Below'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-2">Target Price ($)</label>
              <input value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
                placeholder={currentPrice ? Math.round(currentPrice * 1.05).toString() : '90000'}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-36 focus:outline-none focus:border-yellow-500/50 transition-all" />
            </div>
            <button onClick={() => addAlert.mutate()} disabled={!alertPrice}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Set Alert
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <p className="text-sm font-semibold text-gray-400">Price Chart</p>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setDays(p.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  days === p.days
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div ref={chartRef} />
        </div>
      </div>
    </div>
  )
}
