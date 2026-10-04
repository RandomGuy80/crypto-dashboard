import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function Portfolio() {
  const qc = useQueryClient()

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/portfolio/').then(r => r.data),
    refetchInterval: 30000,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/portfolio/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  })

  const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.current_value || 0), 0)
  const totalPnL = holdings.reduce((sum: number, h: any) => sum + (h.pnl || 0), 0)

  if (isLoading) return <div className="text-gray-400 text-center py-20">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      {holdings.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Value</p>
            <p className="text-2xl font-mono font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total P&L</p>
            <p className={`text-2xl font-mono font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {holdings.length === 0 ? (
        <div className="text-gray-400 text-center py-20">
          No holdings yet. Add them from a coin's detail page.
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Coin</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">Buy Price</th>
                <th className="text-right px-4 py-3">Current Price</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-right px-4 py-3">P&L</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h: any) => (
                <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium uppercase">{h.coin_id}</td>
                  <td className="px-4 py-3 text-right font-mono">{h.amount}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400">${h.buy_price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">${h.current_price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">${h.current_value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.pnl >= 0 ? '+' : ''}${h.pnl?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove.mutate(h.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-xs">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
