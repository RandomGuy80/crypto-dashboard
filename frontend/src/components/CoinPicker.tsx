import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CoinPickerProps {
  value: string
  onChange: (symbol: string) => void
  placeholder?: string
}

export function CoinPicker({ value, onChange, placeholder = 'Search coin...' }: CoinPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const { data: coins = [] } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.get('/coins/?limit=100').then(r => r.data),
    staleTime: 60000,
  })

  const filtered = query.trim().length === 0
    ? coins.slice(0, 8)
    : coins.filter((c: any) => {
        const q = query.toLowerCase().replace('usdt', '')
        return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      }).slice(0, 8)

  const updatePos = () => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setDropdownPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 288) })
  }

  useEffect(() => {
    if (!open) return
    updatePos()
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('[data-coinpicker]')?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  const select = (coin: any) => {
    const sym = coin.symbol.toUpperCase() + 'USDT'
    setQuery(sym)
    onChange(sym)
    setOpen(false)
  }

  const dropdown = open && filtered.length > 0 && createPortal(
    <div
      style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999, background: 'rgba(6,6,16,0.98)', backdropFilter: 'blur(24px)' }}
      className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
    >
      <div>
        {filtered.map((coin: any) => {
          const sym = coin.symbol.toUpperCase() + 'USDT'
          const isSelected = query.toUpperCase() === sym
          return (
            <button
              key={coin.id}
              onMouseDown={e => { e.preventDefault(); select(coin) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all
                border-b border-white/5 last:border-0
                ${isSelected ? 'bg-purple-500/15' : 'hover:bg-white/5'}`}
            >
              <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full ring-1 ring-white/10 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-200 leading-none">{coin.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">{sym}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-gray-300">
                  ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                </p>
                <p className={`text-xs mt-0.5 ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </p>
              </div>
              {isSelected && <span className="text-purple-400 text-xs shrink-0">✓</span>}
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )

  return (
    <div data-coinpicker="true" className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value.toUpperCase()); if (!open) { setOpen(true); updatePos() } }}
        onFocus={() => { setOpen(true); updatePos() }}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm w-44
          focus:outline-none focus:border-purple-500/50 uppercase placeholder-gray-600 transition-all"
      />
      {dropdown}
    </div>
  )
}
