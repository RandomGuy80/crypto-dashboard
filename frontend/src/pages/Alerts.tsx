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
    mutationFn: () => api.post('/alerts/', {
      coin_id: coinId.toUpperCase(),
      target_price: parseFloat(price),
      direction,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); setCoinId(''); setPrice('') },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  if (isLoading) return <div className="text-gray-400 text-center py-20">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-3">New Alert</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Symbol (e.g. BTCUSDT)</label>
            <input value={coinId} onChange={e => setCoinId(e.target.value)} placeholder="BTCUSDT"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-36 focus:outline-none focus:border-purple-500 uppercase" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Direction</label>
            <select value={direction} onChange={e => setDirection(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Target Price ($)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="90000"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-purple-500" />
          </div>
          <button onClick={() => create.mutate()} disabled={!coinId || !price}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors">
            Create Alert
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-gray-400 text-center py-20">No alerts yet.</div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-left px-4 py-3">Direction</th>
                <th className="text-right px-4 py-3">Target Price</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a: any) => (
                <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium">{a.coin_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${a.direction === 'above' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {a.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">${a.target_price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {a.triggered
                      ? <span className="text-yellow-400 text-xs">✓ Triggered</span>
                      : <span className="text-gray-400 text-xs">Active</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove.mutate(a.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-xs">
                      Delete
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
