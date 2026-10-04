import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

export function Watchlist() {
  const prices = useWebSocket()
  const qc = useQueryClient()

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.get('/watchlist/').then(r => r.data),
  })

  const { data: coins = [] } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=100').then(r => r.data),
  })

  const remove = useMutation({
    mutationFn: (coinId: string) => api.delete(`/watchlist/${coinId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const coinMap = Object.fromEntries(coins.map((c: any) => [c.id, c]))

  if (isLoading) return <div className="text-gray-400 text-center py-20">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Watchlist</h1>
      {watchlist.length === 0 ? (
        <div className="text-gray-400 text-center py-20">
          No coins yet. Add them from the <Link to="/" className="text-purple-400">Dashboard</Link>.
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Coin</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">24h %</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item: any) => {
                const coin = coinMap[item.coin_id]
                if (!coin) return null
                const wsPrice = prices[coin.symbol.toUpperCase() + 'USDT']
                const price = wsPrice ? parseFloat(wsPrice) : coin.current_price
                const change = coin.price_change_percentage_24h
                return (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
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
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove.mutate(item.coin_id)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-xs">
                        Remove
                      </button>
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
