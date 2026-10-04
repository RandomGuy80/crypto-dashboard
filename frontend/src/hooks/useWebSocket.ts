import { useEffect, useRef, useState } from 'react'

export interface PriceUpdate {
  symbol: string
  price: string
}

export function useWebSocket() {
  const [prices, setPrices] = useState<Record<string, string>>({})
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      ws.current = new WebSocket(`${protocol}://${window.location.host}/api/ws`)

      ws.current.onmessage = (e) => {
        const data: PriceUpdate = JSON.parse(e.data)
        setPrices((prev) => ({ ...prev, [data.symbol]: data.price }))
      }

      ws.current.onclose = () => setTimeout(connect, 3000)
    }

    connect()
    return () => ws.current?.close()
  }, [])

  return prices
}
