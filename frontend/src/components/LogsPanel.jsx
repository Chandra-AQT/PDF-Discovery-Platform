import { useEffect, useRef } from 'react'

const LEVEL_STYLES = {
  info:    { color: '#0369a1', prefix: '[INFO]   ' },
  success: { color: '#15803d', prefix: '[OK]     ' },
  warn:    { color: '#b45309', prefix: '[WARN]   ' },
  error:   { color: '#b91c1c', prefix: '[ERROR]  ' },
}

export default function LogsPanel({ logs, isRunning }) {
  const bottomRef    = useRef(null)
  const panelRef     = useRef(null)
  const userScrolled = useRef(false)

  useEffect(() => {
    if (!userScrolled.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleScroll = () => {
    const el = panelRef.current; if (!el) return
    userScrolled.current = !(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  return (
    <div className="card flex flex-col overflow-hidden" style={{ height: '280px' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-blue-50"
        style={{ backgroundColor: '#f8fafc' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#94b8e0' }}>Crawl Log</span>
          {isRunning && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-600">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />LIVE
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-slate-400">{logs.length} entries</span>
      </div>

      {/* Log body */}
      <div ref={panelRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-xs"
        style={{ backgroundColor: '#f8fafc' }}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#94b8e0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 opacity-40">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <line x1="7" y1="9" x2="17" y2="9" strokeLinecap="round"/>
              <line x1="7" y1="13" x2="13" y2="13" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] tracking-widest uppercase">Awaiting crawl…</span>
          </div>
        ) : logs.map((log) => {
          const s = LEVEL_STYLES[log.level] || LEVEL_STYLES.info
          return (
            <div key={log.id} className="log-line items-baseline">
              <span className="flex-shrink-0 text-[10px]" style={{ color: '#94a3b8' }}>{log.time}</span>
              <span className="flex-shrink-0 font-semibold" style={{ color: s.color }}>{s.prefix}</span>
              <span style={{ color: '#475569' }}>{log.message}</span>
            </div>
          )
        })}
        {isRunning && (
          <div className="log-line items-center">
            <span className="text-[10px]" style={{ color: '#94a3b8' }}>{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
            <span className="font-semibold" style={{ color: '#0369a1' }}>[INFO]   </span>
            <span className="animate-pulse" style={{ color: '#94b8e0' }}>█</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
