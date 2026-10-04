import { useEffect, useState } from 'react'
import type { Toast as ToastType } from '../hooks/useToast'

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const colors = {
  success: 'border-green-500/40 bg-green-500/10 text-green-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  info: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
}

const dotColors = {
  success: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-yellow-400',
  info: 'bg-purple-400',
}

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      onClick={onDismiss}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl cursor-pointer
        transition-all duration-300 ${colors[toast.type]}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
      style={{ minWidth: 260 }}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColors[toast.type]}`} />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <span className="text-xs opacity-50">{icons[toast.type]}</span>
    </div>
  )
}

export function ToastContainer({ toasts, dismiss }: { toasts: ToastType[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
