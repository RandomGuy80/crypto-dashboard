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

  const totalValue = holdings.reduce((s: number, h: any) => s + (h.current_value || 0), 0)
  const totalPnL = holdings.reduce((s: number, h: any) => s + (h.pnl || 0), 0)
  const pnlPct = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portfolio</h1>

      {holdings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 glow-purple">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Value</p>
            <p className="text-3xl font-bold font-mono">
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`glass rounded-2xl p-6 ${totalPnL >= 0 ? 'glow-cyan' : ''}`}>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total P&L</p>
            <p className={`text-3xl font-bold font-mono ${totalPnL >= 0 ? 'price-up' : 'price-down'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Return</p>
            <p className={`text-3xl font-bold font-mono ${pnlPct >= 0 ? 'price-up' : 'price-down'}`}>
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {holdings.length === 0 ? (
        <div className="glass rounded-2xl py-24 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-400 font-medium">No holdings yet</p>
          <p className="text-gray-600 text-sm mt-1">Add from any coin's detail page</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-4">Coin</th>
                <th className="text-right px-4 py-4">Amount</th>
                <th className="text-right px-4 py-4">Buy Price</th>
                <th className="text-right px-4 py-4">Current</th>
                <th className="text-right px-4 py-4">Value</th>
                <th className="text-right px-4 py-4">P&L</th>
                <th className="px-4 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h: any) => (
                <tr key={h.id} className="border-b border-white/5 glass-hover group">
                  <td className="px-4 py-4 font-semibold uppercase text-gray-300">{h.coin_id}</td>
                  <td className="px-4 py-4 text-right font-mono text-gray-300">{h.amount}</td>
                  <td className="px-4 py-4 text-right font-mono text-gray-500">${h.buy_price.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono">${h.current_price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</td>
                  <td className="px-4 py-4 text-right font-mono font-semibold">${h.current_value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</td>
                  <td className={`px-4 py-4 text-right font-mono font-semibold ${h.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                    {h.pnl >= 0 ? '+' : ''}${h.pnl?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => remove.mutate(h.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100">✕</button>
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
