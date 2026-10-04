import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import { useAuthStore } from './store/auth'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { CoinDetail } from './pages/CoinDetail'
import { Watchlist } from './pages/Watchlist'
import { Portfolio } from './pages/Portfolio'
import { Alerts } from './pages/Alerts'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

function RootRoute() {
  const { accessToken } = useAuthStore()
  if (accessToken) return <Layout><Dashboard /></Layout>
  return <Landing />
}

function AppInner() {
  const { toasts, show, dismiss } = useToast()

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/coin/:id" element={<ProtectedRoute><Layout><CoinDetail /></Layout></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><Layout><Watchlist showToast={show} /></Layout></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Layout><Portfolio /></Layout></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts showToast={show} /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AppInner />
    </QueryClientProvider>
  )
}
