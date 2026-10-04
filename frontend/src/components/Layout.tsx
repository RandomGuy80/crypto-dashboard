import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { api } from '../lib/api'
import { PriceTicker } from './PriceTicker'
import { Footer } from './Footer'

const navLinks = [
  { to: '/', label: 'Market', icon: '◈' },
  { to: '/watchlist', label: 'Watchlist', icon: '★' },
  { to: '/portfolio', label: 'Portfolio', icon: '◎' },
  { to: '/alerts', label: 'Alerts', icon: '◉' },
]

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${(n / 1e6).toFixed(2)}M`
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: gm } = useQuery({
    queryKey: ['market-global'],
    queryFn: () => api.get('/market/global').then(r => r.data),
    refetchInterval: 120000,
    enabled: !!accessToken,
  })

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        {accessToken && <PriceTicker />}

        {gm && (
          <div className="border-b border-white/5 px-6 py-1.5 overflow-hidden">
            <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="text-gray-600">Market Cap</span>
                <span className={`font-medium ${gm.market_cap_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(gm.total_market_cap_usd)}
                </span>
                <span className={gm.market_cap_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {gm.market_cap_change_24h >= 0 ? '▲' : '▼'} {Math.abs(gm.market_cap_change_24h).toFixed(2)}%
                </span>
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <span className="text-gray-600">24h Vol</span>
                <span className="text-gray-300 font-medium">{fmt(gm.total_volume_usd)}</span>
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <span className="text-gray-600">BTC Dom</span>
                <span className="text-orange-400 font-medium">{gm.btc_dominance.toFixed(1)}%</span>
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <span className="text-gray-600">ETH Dom</span>
                <span className="text-blue-400 font-medium">{gm.eth_dominance.toFixed(1)}%</span>
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <span className="text-gray-600">Coins</span>
                <span className="text-gray-300 font-medium">{gm.active_cryptocurrencies.toLocaleString()}</span>
              </span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-sm font-bold pulse-glow">₿</div>
            <span className="text-lg font-bold gradient-text-anim">CryptoDash</span>
          </Link>

          {accessToken && (
            <div className="flex items-center gap-1">
              {navLinks.map(({ to, label, icon }) => (
                <Link key={to} to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    location.pathname === to
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <span className="text-xs opacity-70">{icon}</span>
                  {label}
                </Link>
              ))}
              <button onClick={() => { logout(); navigate('/login') }}
                className="ml-3 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 fade-in">{children}</main>
      <Footer />
    </div>
  )
}
