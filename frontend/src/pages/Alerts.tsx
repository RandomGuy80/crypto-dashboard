import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function Alerts() {
  const qc = useQueryClient()
  const [coinId, setCoinId] = useState('')
  const [price, setPrice] = useState('')
  const [direction, setDirection] = useState<'above' | 'below'>('above')

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/alerts/', { coin_id: coinId.toUpperCase(), target_price: parseFloat(price), direction }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); setCoinId(''); setPrice('') },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeCount = alerts.filter((a: any) => !a.triggered).length
  const triggeredCount = alerts.filter((a: any) => a.triggered).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">
            <span className="text-green-400">{activeCount} active</span>
            {triggeredCount > 0 && <span className="text-gray-600 ml-2">· {triggeredCount} triggered</span>}
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">New Alert</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Symbol</label>
            <input value={coinId} onChange={e => setCoinId(e.target.value)} placeholder="BTCUSDT"
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-32 focus:outline-none focus:border-purple-500/50 uppercase placeholder-gray-600 transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Direction</label>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {(['above', 'below'] as const).map(d => (
                <button key={d} onClick={() => setDirection(d)}
                  className={`px-4 py-2.5 text-sm font-medium transition-all ${
                    direction === d
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
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="90000"
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-32 focus:outline-none focus:border-purple-500/50 placeholder-gray-600 transition-all" />
          </div>
          <button onClick={() => create.mutate()} disabled={!coinId || !price}
            className="gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            + Create
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass rounded-2xl py-24 text-center">
          <p className="text-4xl mb-4">🔔</p>
          <p className="text-gray-400 font-medium">No alerts yet</p>
          <p className="text-gray-600 text-sm mt-1">Create one above to get notified</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-4">Symbol</th>
                <th className="text-left px-4 py-4">Direction</th>
                <th className="text-right px-4 py-4">Target</th>
                <th className="text-left px-4 py-4">Status</th>
                <th className="px-4 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a: any) => (
                <tr key={a.id} className="border-b border-white/5 glass-hover group">
                  <td className="px-4 py-4 font-semibold">{a.coin_id}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      a.direction === 'above' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {a.direction === 'above' ? '▲' : '▼'} {a.direction}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-semibold">${a.target_price.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    {a.triggered
                      ? <span className="flex items-center gap-1.5 text-yellow-400 text-xs"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>Triggered</span>
                      : <span className="flex items-center gap-1.5 text-green-400 text-xs"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Active</span>
                    }
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => remove.mutate(a.id)}
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
