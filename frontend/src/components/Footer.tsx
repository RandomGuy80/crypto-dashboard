import { Link } from 'react-router-dom'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-white/5" style={{ background: 'rgba(0,0,0,0.25)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center text-sm font-bold">₿</div>
              <span className="font-bold gradient-text-anim text-lg">CryptoDash</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Real-time crypto portfolio tracker with live prices, price alerts and interactive charts.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Platform</p>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Market Overview' },
                { to: '/watchlist', label: 'Watchlist' },
                { to: '/portfolio', label: 'Portfolio' },
                { to: '/alerts', label: 'Price Alerts' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-gray-500 hover:text-purple-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Data Sources</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                CoinGecko API — market data
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Binance WebSocket — live prices
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                PostgreSQL + Redis — storage
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {year} CryptoDash. Built for portfolio showcase purposes only.
          </p>
          <p className="text-xs text-gray-700">
            Not financial advice. Crypto prices are volatile — trade responsibly.
          </p>
        </div>
      </div>
    </footer>
  )
}
