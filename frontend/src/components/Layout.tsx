import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const navLinks = [
  { to: '/', label: 'Market' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/alerts', label: 'Alerts' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-sm font-bold pulse-glow">₿</div>
            <span className="text-lg font-bold gradient-text">CryptoDash</span>
          </Link>

          {accessToken && (
            <div className="flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === to
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
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
    </div>
  )
}
