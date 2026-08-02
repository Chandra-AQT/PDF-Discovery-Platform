import { useState, useEffect } from 'react'
import { BASE_URL } from '../api/api'

// Ping /status to determine if the backend is reachable
function useApiStatus() {
  const [online, setOnline] = useState(null) // null = checking, true = online, false = offline

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
    const interval = setInterval(check, 15000) // re-check every 15s
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return online
}

export default function Header({ isRunning }) {
  const apiOnline = useApiStatus()

  // Indicator color & pulse based on status
  const dot = apiOnline === null
    ? { color: 'bg-zinc-500',    pulse: false,  label: 'Connecting…' }
    : apiOnline
    ? { color: 'bg-emerald-400', pulse: true,   label: 'API Online'  }
    : { color: 'bg-red-500',     pulse: false,  label: 'API Offline' }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-surface-700/60 bg-glass sticky top-0 z-50">

      {/* Left — Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <div
            className="absolute inset-0 rounded-xl bg-brand-gradient flex items-center justify-center"
            style={{ boxShadow: '0 0 16px rgba(124,58,237,0.5)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {isRunning && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface-950 animate-pulse" />
          )}
        </div>
        {/* Name only — no version subtitle */}
        <span className="font-display font-bold text-white text-sm leading-none">DocPlus</span>
      </div>

      {/* Centre — crawler active badge */}
      {isRunning && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs text-emerald-400 tracking-wide">CRAWLER ACTIVE</span>
        </div>
      )}

      {/* Right — single blink indicator dot with tooltip */}
      <div className="flex items-center gap-2" title={dot.label}>
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot.color} ${dot.pulse ? 'animate-pulse' : ''}`}
          style={{ boxShadow: apiOnline ? '0 0 6px rgba(52,211,153,0.8)' : apiOnline === false ? '0 0 6px rgba(239,68,68,0.8)' : 'none' }}
        />
      </div>

    </header>
  )
}
