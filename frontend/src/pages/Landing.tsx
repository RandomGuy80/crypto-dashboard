import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'

const FEATURES = [
  {
    icon: '◈',
    color: '#a855f7',
    title: 'Live Market Data',
    desc: 'Real-time prices for 20+ top cryptocurrencies powered by Binance WebSocket. Prices update every second — no refresh needed.',
  },
  {
    icon: '◎',
    color: '#22d3ee',
    title: 'Portfolio Tracker',
    desc: 'Track your holdings with live P&L calculations. See your total value, return %, and allocation breakdown with an interactive donut chart.',
  },
  {
    icon: '◉',
    color: '#ec4899',
    title: 'Price Alerts',
    desc: 'Set price alerts for any coin — above or below a target. Get notified instantly inside the app when your alert triggers.',
  },
  {
    icon: '★',
    color: '#f97316',
    title: 'Watchlist',
    desc: 'Save coins you\'re watching with one click. See live prices, 7D sparklines and 24h changes at a glance — your personal market feed.',
  },
  {
    icon: '▲',
    color: '#4ade80',
    title: 'Interactive Charts',
    desc: 'TradingView candlestick charts with 1D, 7D, 30D and 1Y timeframes for every coin. Price range indicator shows where you are in the period.',
  },
  {
    icon: '⊕',
    color: '#eab308',
    title: 'Market Intelligence',
    desc: 'Global market cap, BTC & ETH dominance with circular progress gauges, 24h volume — all updated every 2 minutes.',
  },
]

const FAQ = [
  {
    q: 'Is this free to use?',
    a: 'Yes, completely free. Register with any email and start tracking immediately — no credit card required.',
  },
  {
    q: 'Where does the price data come from?',
    a: 'Market data comes from CoinGecko (prices, market cap, history). Real-time price updates are streamed directly from Binance WebSocket, so you see changes within milliseconds.',
  },
  {
    q: 'What is the difference between Watchlist and Portfolio?',
    a: 'Watchlist is for coins you want to monitor — add any coin with one click and track its price. Portfolio is for coins you actually own — you enter how much you bought and at what price, and the app calculates your profit/loss in real time.',
  },
  {
    q: 'How do Price Alerts work?',
    a: 'Set a target price and direction (above/below) for any coin. The backend checks prices on every Binance tick. When triggered, you\'ll see a notification toast inside the app. Alerts are split into Active and Triggered sections.',
  },
  {
    q: 'Is my data safe?',
    a: 'Passwords are hashed with bcrypt. Authentication uses short-lived JWT access tokens (15 min) with rotating refresh tokens (7 days). All API endpoints require authentication.',
  },
  {
    q: 'What coins are supported?',
    a: 'The dashboard shows the top 20 coins by market cap. You can add any of the top 100 to your Watchlist or Portfolio. Price alerts support any coin available on Binance (search by symbol).',
  },
]

const STATS = [
  { value: '20+', label: 'Live Coins' },
  { value: '1s', label: 'Price Updates' },
  { value: '4', label: 'Timeframes' },
  { value: '∞', label: 'Free Forever' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${open ? 'glow-purple' : ''}`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <p className="font-semibold text-sm text-gray-200">{q}</p>
        <span className={`text-purple-400 text-lg transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-sm font-bold pulse-glow">₿</div>
            <span className="text-lg font-bold gradient-text-anim">CryptoDash</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              Sign in
            </Link>
            <Link to="/register" className="gradient-btn px-5 py-2 rounded-xl text-sm font-semibold">
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-green-400 mb-8">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live prices via Binance WebSocket
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            <span className="gradient-text-anim">Crypto Dashboard</span>
            <br />
            <span className="text-gray-200">Built for traders</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Track prices in real-time, manage your portfolio with live P&L, set price alerts and monitor the global crypto market — all in one place.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="gradient-btn px-8 py-3.5 rounded-2xl text-base font-bold">
              <span>Start for free →</span>
            </Link>
            <Link to="/login" className="glass-card-hover px-8 py-3.5 rounded-2xl text-base font-semibold text-gray-300 border border-white/10 hover:border-purple-500/30 transition-all">
              Sign in
            </Link>
          </div>

          {/* hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <p className="text-2xl font-bold gradient-text-anim">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100">Everything you need to track crypto</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Professional-grade tools built with Go, React and real-time WebSocket data.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card-hover holo-card rounded-2xl p-6 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 transition-all"
                  style={{ background: `${f.color}18`, color: f.color, boxShadow: `0 0 16px ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100">Up and running in seconds</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', color: '#a855f7', title: 'Create an account', desc: 'Register with your email — no credit card, no verification. Your data is encrypted and stored securely.' },
              { step: '02', color: '#22d3ee', title: 'Add coins to track', desc: 'Browse the live market and star any coin to add it to your Watchlist. Open a coin to add it to your Portfolio.' },
              { step: '03', color: '#ec4899', title: 'Set alerts & monitor', desc: 'Set price alerts and come back when they fire. Your portfolio P&L updates every 30 seconds automatically.' },
            ].map(s => (
              <div key={s.step} className="glass rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-5xl font-black opacity-5" style={{ color: s.color }}>{s.step}</div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold mb-4"
                  style={{ background: `${s.color}20`, color: s.color }}>
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-100 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech stack ── */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">Tech Stack</p>
            <h2 className="text-3xl font-bold text-gray-100">Built with production-grade tools</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Go 1.26', color: '#22d3ee' },
              { label: 'Fiber v2', color: '#22d3ee' },
              { label: 'PostgreSQL', color: '#3b82f6' },
              { label: 'Redis', color: '#f87171' },
              { label: 'React 18', color: '#a855f7' },
              { label: 'TypeScript', color: '#3b82f6' },
              { label: 'Tailwind CSS v4', color: '#22d3ee' },
              { label: 'TradingView Charts', color: '#4ade80' },
              { label: 'Binance WebSocket', color: '#f97316' },
              { label: 'CoinGecko API', color: '#4ade80' },
              { label: 'JWT Auth', color: '#eab308' },
              { label: 'Docker', color: '#3b82f6' },
            ].map(t => (
              <span key={t.label}
                className="glass px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ color: t.color, borderColor: `${t.color}30` }}>
                {t.label}
              </span>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="glass-card-hover holo-card rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              <span className="gradient-text-anim">Start tracking today</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Free forever. No credit card. Real-time data from day one.</p>
            <Link to="/register" className="gradient-btn inline-block px-10 py-4 rounded-2xl text-base font-bold">
              <span>Create free account →</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
