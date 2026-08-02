import { useEffect, useRef } from 'react'

const LEVEL_STYLES = {
  info:    { color: 'text-sky-300',     prefix: '[INFO]   ' },
  success: { color: 'text-emerald-300', prefix: '[OK]     ' },
  warn:    { color: 'text-yellow-300',  prefix: '[WARN]   ' },
  error:   { color: 'text-red-300',     prefix: '[ERROR]  ' },
}

export default function LogsPanel({ logs, isRunning }) {
  const bottomRef    = useRef(null)
  const panelRef     = useRef(null)
  const userScrolled = useRef(false)

  useEffect(() => { if (!userScrolled.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  const handleScroll = () => {
    const el = panelRef.current; if (!el) return
    userScrolled.current = !(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  return (
    <div className="card flex flex-col" style={{ height: '280px' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">Crawl Log</span>
          {isRunning && <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />LIVE</span>}
        </div>
        <span className="font-mono text-[11px] text-zinc-600">{logs.length} entries</span>
      </div>

      <div ref={panelRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-xs bg-surface-950/60">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 opacity-30">
              <rect x="3" y="5" width="18" height="14" rx="2" /><line x1="7" y1="9" x2="17" y2="9" strokeLinecap="round" /><line x1="7" y1="13" x2="13" y2="13" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] tracking-widest uppercase">Awaiting crawl…</span>
          </div>
        ) : logs.map((log) => {
          const s = LEVEL_STYLES[log.level] || LEVEL_STYLES.info
          return (
            <div key={log.id} className="log-line items-baseline">
              <span className="text-zinc-700 flex-shrink-0 text-[10px]">{log.time}</span>
              <span className={`flex-shrink-0 font-semibold ${s.color}`}>{s.prefix}</span>
              <span className="text-zinc-400">{log.message}</span>
            </div>
          )
        })}
        {isRunning && (
          <div className="log-line items-center">
            <span className="text-zinc-700 text-[10px]">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
            <span className="text-brand-400 font-semibold">[INFO]   </span>
            <span className="text-zinc-600 animate-pulse">█</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
