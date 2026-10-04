import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-purple-400">CryptoDash</Link>
        {accessToken && (
          <div className="flex gap-6 items-center text-sm">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
            <Link to="/watchlist" className="text-gray-300 hover:text-white transition-colors">Watchlist</Link>
            <Link to="/portfolio" className="text-gray-300 hover:text-white transition-colors">Portfolio</Link>
            <Link to="/alerts" className="text-gray-300 hover:text-white transition-colors">Alerts</Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">Logout</button>
          </div>
        )}
      </nav>
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  )
}
