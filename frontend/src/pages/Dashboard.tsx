import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { Sparkline } from '../components/Sparkline'
import { CircularProgress } from '../components/CircularProgress'

interface Coin {
  id: string; symbol: string; name: string
  current_price: number; price_change_percentage_24h: number
  market_cap: number; total_volume: number; image: string
  sparkline_in_7d?: { price: number[] }
}

function Skeleton() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  return `$${(n / 1e6).toFixed(2)}M`
}

export function Dashboard() {
  const { prices, flash } = useWebSocket()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: allCoins = [], isLoading } = useQuery<Coin[]>({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=100').then(r => r.data),
    refetchInterval: 30000,
  })

  const coins = search.trim()
    ? allCoins.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
      )
    : allCoins.slice(0, 20)

  const { data: gm } = useQuery({
    queryKey: ['market-global'],
    queryFn: () => api.get('/market/global').then(r => r.data),
    refetchInterval: 120000,
  })

  const addToWatchlist = useMutation({
    mutationFn: (coinId: string) => api.post(`/watchlist/${coinId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const getPrice = (coin: Coin) => {
    const ws = prices[coin.symbol.toUpperCase() + 'USDT']
    return ws ? parseFloat(ws) : coin.current_price
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-anim">Market Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Live prices updated in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search coins..."
              className="bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2 text-sm w-44
                focus:outline-none focus:border-purple-500/50 placeholder-gray-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {gm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card-hover holo-card rounded-2xl p-4 flex items-center gap-4">
            <CircularProgress value={gm.btc_dominance} max={100} size={62} strokeWidth={5} color="#f97316" label={`${gm.btc_dominance.toFixed(1)}%`} sublabel="BTC" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">BTC Dominance</p>
              <p className="text-xl font-bold text-orange-400 font-mono mt-0.5">{gm.btc_dominance.toFixed(1)}%</p>
            </div>
          </div>
          <div className="glass-card-hover holo-card rounded-2xl p-4 flex items-center gap-4">
            <CircularProgress value={gm.eth_dominance} max={100} size={62} strokeWidth={5} color="#3b82f6" label={`${gm.eth_dominance.toFixed(1)}%`} sublabel="ETH" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">ETH Dominance</p>
              <p className="text-xl font-bold text-blue-400 font-mono mt-0.5">{gm.eth_dominance.toFixed(1)}%</p>
            </div>
          </div>
          <div className="glass-card-hover holo-card rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Global Market Cap</p>
            <p className="text-2xl font-bold font-mono">{fmt(gm.total_market_cap_usd)}</p>
            <p className={`text-xs mt-1.5 font-semibold ${gm.market_cap_change_24h >= 0 ? 'price-up' : 'price-down'}`}>
              {gm.market_cap_change_24h >= 0 ? '▲' : '▼'} {Math.abs(gm.market_cap_change_24h).toFixed(2)}% past 24h
            </p>
          </div>
          <div className="glass-card-hover holo-card rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">24h Volume</p>
            <p className="text-2xl font-bold font-mono">{fmt(gm.total_volume_usd)}</p>
            <p className="text-xs mt-1.5 text-gray-500">{gm.active_cryptocurrencies.toLocaleString()} active assets</p>
          </div>
        </div>
      )}

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
              <th className="text-right px-4 py-4 hidden xl:table-cell">7D Chart</th>
              <th className="px-4 py-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} />)
              : coins.map((coin, i) => {
                const price = getPrice(coin)
                const change = coin.price_change_percentage_24h
                const isUp = change >= 0
                const wsKey = coin.symbol.toUpperCase() + 'USDT'
                const flashDir = flash[wsKey]
                return (
                  <tr key={coin.id}
                    className={`border-b border-white/5 group transition-all ${isUp ? 'row-glow-up' : 'row-glow-down'}`}>
                    <td className="px-4 py-4 text-gray-600 text-xs font-mono">{i + 1}</td>
                    <td className="px-4 py-4">
                      <Link to={`/coin/${coin.id}`} className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full ring-1 ring-white/10" />
                        <div>
                          <p className="font-semibold group-hover:text-purple-300 transition-colors">{coin.name}</p>
                          <p className="text-gray-500 text-xs uppercase">{coin.symbol}</p>
                        </div>
                      </Link>
                    </td>
                    <td className={`px-4 py-4 text-right font-mono font-semibold rounded transition-all ${
                      flashDir === 'up' ? 'flash-up' : flashDir === 'down' ? 'flash-down' : ''
                    }`}>
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
                    <td className="px-4 py-4 text-right hidden xl:table-cell">
                      <div className="flex justify-end">
                        <Sparkline data={coin.sparkline_in_7d?.price ?? []} positive={isUp} />
                      </div>
                    </td>
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
