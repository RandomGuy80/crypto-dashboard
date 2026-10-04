import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

interface Coin {
  id: string; symbol: string; name: string
  current_price: number; price_change_percentage_24h: number
  market_cap: number; total_volume: number; image: string
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

  const fmt = (n: number) => n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toLocaleString()}`

  const getPrice = (coin: Coin) => {
    const wsPrice = prices[coin.symbol.toUpperCase() + 'USDT']
    return wsPrice ? parseFloat(wsPrice) : coin.current_price
  }

  if (isLoading) return <div className="text-gray-400 text-center py-20">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Market</h1>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">24h %</th>
              <th className="text-right px-4 py-3">Market Cap</th>
              <th className="text-right px-4 py-3">Volume</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, i) => {
              const price = getPrice(coin)
              const change = coin.price_change_percentage_24h
              return (
                <tr key={coin.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/coin/${coin.id}`} className="flex items-center gap-3 hover:text-purple-400">
                      <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                      <span className="font-medium">{coin.name}</span>
                      <span className="text-gray-500 uppercase">{coin.symbol}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ${price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 6 : 2 })}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{fmt(coin.market_cap)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{fmt(coin.total_volume)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => addToWatchlist.mutate(coin.id)}
                      className="text-gray-500 hover:text-purple-400 transition-colors text-lg"
                      title="Add to watchlist"
                    >★</button>
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
