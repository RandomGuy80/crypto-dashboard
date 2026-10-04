import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

interface Coin {
  id: string; symbol: string; name: string
  current_price: number; price_change_percentage_24h: number
  market_cap: number; total_volume: number; image: string
}

function Skeleton() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function Dashboard() {
  const prices = useWebSocket()
  const qc = useQueryClient()

  const { data: coins = [], isLoading } = useQuery<Coin[]>({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=20').then(r => r.data),
    refetchInterval: 30000,
  })

  const addToWatchlist = useMutation({
    mutationFn: (coinId: string) => api.post(`/watchlist/${coinId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(2)}M`

  const getPrice = (coin: Coin) => {
    const ws = prices[coin.symbol.toUpperCase() + 'USDT']
    return ws ? parseFloat(ws) : coin.current_price
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Live prices updated in real-time</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-4 w-8">#</th>
              <th className="text-left px-4 py-4">Asset</th>
              <th className="text-right px-4 py-4">Price</th>
              <th className="text-right px-4 py-4">24h Change</th>
              <th className="text-right px-4 py-4 hidden md:table-cell">Market Cap</th>
              <th className="text-right px-4 py-4 hidden lg:table-cell">Volume</th>
              <th className="px-4 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} />)
              : coins.map((coin, i) => {
                const price = getPrice(coin)
                const change = coin.price_change_percentage_24h
                const isUp = change >= 0
                return (
                  <tr key={coin.id} className="border-b border-white/5 glass-hover group transition-all">
                    <td className="px-4 py-4 text-gray-600 text-xs">{i + 1}</td>
                    <td className="px-4 py-4">
                      <Link to={`/coin/${coin.id}`} className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full ring-1 ring-white/10" />
                        <div>
                          <p className="font-semibold group-hover:text-purple-300 transition-colors">{coin.name}</p>
                          <p className="text-gray-500 text-xs uppercase">{coin.symbol}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-semibold">
                      ${price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 6 : 2 })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        isUp ? 'bg-green-500/10 price-up' : 'bg-red-500/10 price-down'
                      }`}>
                        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-400 hidden md:table-cell">{fmt(coin.market_cap)}</td>
                    <td className="px-4 py-4 text-right text-gray-400 hidden lg:table-cell">{fmt(coin.total_volume)}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => addToWatchlist.mutate(coin.id)}
                        className="text-gray-600 hover:text-yellow-400 transition-colors text-lg opacity-0 group-hover:opacity-100"
                        title="Add to watchlist">★</button>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
