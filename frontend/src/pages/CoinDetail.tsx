import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

const PERIODS = [{ label: '1D', days: 1 }, { label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '1Y', days: 365 }]

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
  const prices = useWebSocket()
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

  const addHolding = useMutation({
    mutationFn: () => api.post('/portfolio/', { coin_id: id, amount: parseFloat(amount), buy_price: parseFloat(buyPrice) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); setShowPortfolioForm(false) },
  })

  const addAlert = useMutation({
    mutationFn: () => api.post('/alerts/', { coin_id: coin?.symbol.toUpperCase() + 'USDT', target_price: parseFloat(alertPrice), direction: alertDir }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); setShowAlertForm(false) },
  })

  useEffect(() => {
    if (!chartRef.current || !candles.length) return
    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#111827' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      width: chartRef.current.clientWidth,
      height: 400,
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    series.setData(candles)
    chart.timeScale().fitContent()
    const resize = () => chart.applyOptions({ width: chartRef.current!.clientWidth })
    window.addEventListener('resize', resize)
    return () => { chart.remove(); window.removeEventListener('resize', resize) }
  }, [candles])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {coin && <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />}
          <div>
            <h1 className="text-2xl font-bold">{coin?.name ?? id}</h1>
            <span className="text-gray-400 uppercase text-sm">{coin?.symbol}</span>
          </div>
          {currentPrice && (
            <span className="text-3xl font-mono font-semibold">
              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: currentPrice < 1 ? 6 : 2 })}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPortfolioForm(!showPortfolioForm)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors">
            + Portfolio
          </button>
          <button onClick={() => setShowAlertForm(!showAlertForm)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors">
            🔔 Alert
          </button>
        </div>
      </div>

      {showPortfolioForm && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.5"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-28 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Buy Price ($)</label>
            <input value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="80000"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-purple-500" />
          </div>
          <button onClick={() => addHolding.mutate()}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors">
            Add
          </button>
        </div>
      )}

      {showAlertForm && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Direction</label>
            <select value={alertDir} onChange={e => setAlertDir(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Target Price ($)</label>
            <input value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="90000"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-purple-500" />
          </div>
          <button onClick={() => addAlert.mutate()}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm transition-colors">
            Set Alert
          </button>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex gap-2 mb-4">
          {PERIODS.map(p => (
            <button key={p.days} onClick={() => setDays(p.days)}
              className={`px-3 py-1 rounded text-sm transition-colors ${days === p.days ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div ref={chartRef} />
      </div>
    </div>
  )
}
