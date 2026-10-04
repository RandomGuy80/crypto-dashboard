import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

export function PriceTicker() {
  const { prices } = useWebSocket()

  const { data: coins = [] } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=20').then(r => r.data),
    staleTime: 60000,
  })

  if (coins.length === 0) return null

  const items = coins.map((c: any) => {
    const ws = prices[c.symbol.toUpperCase() + 'USDT']
    const price = ws ? parseFloat(ws) : c.current_price
    const change = c.price_change_percentage_24h
    return { ...c, livePrice: price, change }
  })

  // double for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="border-b border-white/5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="ticker-track flex gap-0 py-2 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 px-5 border-r border-white/5">
            <img src={c.image} alt={c.name} className="w-4 h-4 rounded-full" />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{c.symbol}</span>
            <span className="text-xs font-mono text-gray-200">
              ${c.livePrice.toLocaleString(undefined, { maximumFractionDigits: c.livePrice < 1 ? 4 : 2 })}
            </span>
            <span className={`text-xs font-medium ${c.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {c.change >= 0 ? '▲' : '▼'}{Math.abs(c.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
