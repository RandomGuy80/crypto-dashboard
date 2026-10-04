import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CoinPickerProps {
  value: string
  onChange: (symbol: string) => void
  placeholder?: string
}

export function CoinPicker({ value, onChange, placeholder = 'BTCUSDT' }: CoinPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: coins = [] } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=100').then(r => r.data),
    staleTime: 60000,
  })

  const filtered = query.trim().length === 0
    ? coins.slice(0, 8)
    : coins.filter((c: any) => {
        const q = query.toLowerCase()
        return (
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.symbol.toLowerCase() + 'usdt').includes(q)
        )
      }).slice(0, 8)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (coin: any) => {
    const sym = coin.symbol.toUpperCase() + 'USDT'
    setQuery(sym)
    onChange(sym)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value.toUpperCase()); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-44
          focus:outline-none focus:border-purple-500/50 uppercase placeholder-gray-600 transition-all"
      />

      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-72 z-50 rounded-2xl overflow-hidden
          border border-white/10 shadow-2xl"
          style={{
            background: 'rgba(8, 8, 18, 0.97)',
            backdropFilter: 'blur(20px)',
          }}>
          {filtered.map((coin: any, i: number) => {
            const sym = coin.symbol.toUpperCase() + 'USDT'
            const isSelected = query === sym
            return (
              <button
                key={coin.id}
                onMouseDown={() => select(coin)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                  border-b border-white/5 last:border-0
                  ${isSelected
                    ? 'bg-purple-500/15 text-white'
                    : 'hover:bg-white/5 text-gray-300'
                  }`}
              >
                <img src={coin.image} alt={coin.name}
                  className="w-7 h-7 rounded-full ring-1 ring-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-none">{coin.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase">{sym}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-gray-300">
                    ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                  </p>
                  <p className={`text-xs mt-0.5 ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </p>
                </div>
                {isSelected && (
                  <span className="text-purple-400 text-xs ml-1">✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
