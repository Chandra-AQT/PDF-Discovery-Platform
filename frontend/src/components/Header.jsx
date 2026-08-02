import { useState, useEffect } from 'react'
import { BASE_URL } from '../api/api'

function useApiStatus() {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch(`${BASE_URL}/status`, { signal: AbortSignal.timeout(4000) })
        if (!cancelled) setOnline(res.ok)
      } catch {
        if (!cancelled) setOnline(false)
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return online
}

export default function Header({ isRunning }) {
  const apiOnline = useApiStatus()

  const dot = apiOnline === null
    ? { color: '#94a3b8', pulse: false, label: 'Connecting…' }
    : apiOnline
    ? { color: '#22c55e', pulse: true,  label: 'API Online'  }
    : { color: '#ef4444', pulse: false, label: 'API Offline' }

  return (
    <header className="h-14 flex items-center justify-between px-6 sticky top-0 z-50 bg-glass border-b border-blue-100"
      style={{ boxShadow: '0 1px 8px rgba(14,72,140,0.06)' }}>

      {/* Left — Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <div
            className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 14px rgba(14,165,233,0.4)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {isRunning && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
          )}
        </div>
        <span className="font-display font-bold text-sky-800 text-sm leading-none tracking-tight">DocPlus</span>
      </div>

      {/* Centre — crawler active badge */}
      {isRunning && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs text-emerald-700 tracking-wide">CRAWLER ACTIVE</span>
        </div>
      )}

      {/* Right — API status dot */}
      <div className="flex items-center" title={dot.label}>
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot.pulse ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: dot.color,
            boxShadow: apiOnline ? '0 0 6px rgba(34,197,94,0.7)' : apiOnline === false ? '0 0 6px rgba(239,68,68,0.7)' : 'none'
          }}
        />
      </div>
    </header>
  )
}
