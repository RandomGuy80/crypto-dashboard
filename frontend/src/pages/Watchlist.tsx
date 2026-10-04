import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { Sparkline } from '../components/Sparkline'

interface WatchlistProps {
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${(n / 1e6).toFixed(2)}M`
}

export function Watchlist({ showToast }: WatchlistProps) {
  const prices = useWebSocket()
  const qc = useQueryClient()

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.get('/watchlist/').then(r => r.data),
  })

  const { data: coins = [] } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=100').then(r => r.data),
    refetchInterval: 30000,
  })

  const remove = useMutation({
    mutationFn: (coinId: string) => api.delete(`/watchlist/${coinId}`),
    onSuccess: (_, coinId) => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      showToast?.(`Removed from watchlist`, 'info')
    },
  })

  const coinMap = Object.fromEntries(coins.map((c: any) => [c.id, c]))

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const watchedCoins = watchlist.map((item: any) => coinMap[item.coin_id]).filter(Boolean)
  const totalWatchedCap = watchedCoins.reduce((s: number, c: any) => s + (c.market_cap || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            {watchlist.length > 0
              ? <><span className="text-purple-400 font-medium">{watchlist.length}</span> coins tracked · combined cap {fmt(totalWatchedCap)}</>
              : 'Track your favourite coins'
            }
          </p>
        </div>
        <Link to="/"
          className="gradient-btn px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          + Add coins
        </Link>
      </div>

      {watchlist.length === 0 ? (
        <div className="glass rounded-2xl py-24 text-center">
          <p className="text-4xl mb-4">★</p>
          <p className="text-gray-400 font-medium">Your watchlist is empty</p>
          <p className="text-gray-600 text-sm mt-1">
            Go to <Link to="/" className="text-purple-400 hover:text-purple-300">Market</Link> and click ★ on any coin
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-4">Asset</th>
                <th className="text-right px-4 py-4">Price</th>
                <th className="text-right px-4 py-4">24h Change</th>
                <th className="text-right px-4 py-4 hidden md:table-cell">Market Cap</th>
                <th className="text-right px-4 py-4 hidden lg:table-cell">Volume</th>
                <th className="text-right px-4 py-4 hidden xl:table-cell">7D Chart</th>
                <th className="px-4 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item: any) => {
                const coin = coinMap[item.coin_id]
                if (!coin) return null
                const wsPrice = prices[coin.symbol.toUpperCase() + 'USDT']
                const price = wsPrice ? parseFloat(wsPrice) : coin.current_price
                const change = coin.price_change_percentage_24h
                const isUp = change >= 0
                return (
                  <tr key={item.id} className="border-b border-white/5 glass-hover group transition-all">
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
                    <td className="px-4 py-4 text-right hidden xl:table-cell">
                      <div className="flex justify-end">
                        <Sparkline data={coin.sparkline_in_7d?.price ?? []} positive={isUp} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => remove.mutate(item.coin_id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100">✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
