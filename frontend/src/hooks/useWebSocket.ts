import { useEffect, useRef, useState, useCallback } from 'react'

export interface PriceUpdate {
  symbol: string
  price: string
}

export type FlashDir = 'up' | 'down' | null

export function useWebSocket() {
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<Record<string, FlashDir>>({})
  const ws = useRef<WebSocket | null>(null)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleMessage = useCallback((e: MessageEvent) => {
    const data: PriceUpdate = JSON.parse(e.data)
    setPrices(prev => {
      const prevPrice = prev[data.symbol]
      if (prevPrice !== undefined && prevPrice !== data.price) {
        const dir: FlashDir = parseFloat(data.price) > parseFloat(prevPrice) ? 'up' : 'down'
        setFlash(f => ({ ...f, [data.symbol]: dir }))
        clearTimeout(timers.current[data.symbol])
        timers.current[data.symbol] = setTimeout(() => {
          setFlash(f => ({ ...f, [data.symbol]: null }))
        }, 700)
      }
      return { ...prev, [data.symbol]: data.price }
    })
  }, [])

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      ws.current = new WebSocket(`${protocol}://${window.location.host}/api/ws`)
      ws.current.onmessage = handleMessage
      ws.current.onclose = () => setTimeout(connect, 3000)
    }
    connect()
    return () => {
      ws.current?.close()
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [handleMessage])

  return { prices, flash }
}
