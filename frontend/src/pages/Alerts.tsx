import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { CoinPicker } from '../components/CoinPicker'

interface AlertsProps {
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

export function Alerts({ showToast }: AlertsProps) {
  const qc = useQueryClient()
  const [coinId, setCoinId] = useState('')
  const [price, setPrice] = useState('')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const prevTriggeredIds = useRef<Set<string>>(new Set())

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data),
    refetchInterval: 10000,
  })

  useEffect(() => {
    const newlyTriggered = alerts.filter((a: any) => a.triggered && !prevTriggeredIds.current.has(a.id))
    newlyTriggered.forEach((a: any) => {
      showToast?.(`🔔 Alert triggered: ${a.coin_id} ${a.direction === 'above' ? '▲' : '▼'} $${a.target_price.toLocaleString()}`, 'warning')
      prevTriggeredIds.current.add(a.id)
    })
    alerts.filter((a: any) => a.triggered).forEach((a: any) => prevTriggeredIds.current.add(a.id))
  }, [alerts, showToast])

  const create = useMutation({
    mutationFn: () => api.post('/alerts/', { coin_id: coinId.toUpperCase(), target_price: parseFloat(price), direction }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      setCoinId(''); setPrice('')
      showToast?.('Alert created', 'success')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      showToast?.('Alert removed', 'info')
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeAlerts = alerts.filter((a: any) => !a.triggered)
  const triggeredAlerts = alerts.filter((a: any) => a.triggered)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeAlerts.length > 0 && <span className="text-green-400">{activeAlerts.length} active</span>}
            {triggeredAlerts.length > 0 && (
              <span className="text-yellow-400 ml-2">· {triggeredAlerts.length} triggered</span>
            )}
            {alerts.length === 0 && 'No alerts yet'}
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">New Alert</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Symbol</label>
            <CoinPicker value={coinId} onChange={setCoinId} />
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
          <button onClick={() => create.mutate()} disabled={!coinId || !price || create.isPending}
            className="gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            {create.isPending ? '...' : '+ Create'}
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass rounded-2xl py-24 text-center">
          <p className="text-4xl mb-4">◉</p>
          <p className="text-gray-400 font-medium">No alerts yet</p>
          <p className="text-gray-600 text-sm mt-1">Create one above or from any coin page</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAlerts.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Symbol</th>
                    <th className="text-left px-4 py-3">Direction</th>
                    <th className="text-right px-4 py-3">Target</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.map((a: any) => (
                    <tr key={a.id} className="border-t border-white/5 glass-hover group">
                      <td className="px-4 py-3.5 font-semibold">{a.coin_id}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          a.direction === 'above' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {a.direction === 'above' ? '▲' : '▼'} {a.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold">${a.target_price.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-green-400 text-xs">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Active
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => remove.mutate(a.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {triggeredAlerts.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden opacity-70">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Triggered</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {triggeredAlerts.map((a: any) => (
                    <tr key={a.id} className="border-t border-white/5 glass-hover group">
                      <td className="px-4 py-3.5 font-semibold text-gray-400">{a.coin_id}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          a.direction === 'above' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {a.direction === 'above' ? '▲' : '▼'} {a.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">${a.target_price.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-yellow-400 text-xs">
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>Triggered
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
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
      )}
    </div>
  )
}
