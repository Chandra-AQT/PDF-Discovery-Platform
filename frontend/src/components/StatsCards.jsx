import { useEffect, useState, useRef } from 'react'

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  const raf = useRef(null), prev = useRef(0)
  useEffect(() => {
    if (target === prev.current) return
    const start = prev.current, end = target, t0 = performance.now()
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      setVal(Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(step); else prev.current = end
    }
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return val
}

function StatCard({ label, value, icon, color, description, isActive }) {
  const animated = useCountUp(value)
  const colors = {
    brand:   { text: 'text-brand-400',   bg: 'bg-brand-500/10',   border: 'border-brand-500/20',   glow: 'rgba(139,92,246,0.15)' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'rgba(52,211,153,0.12)' },
    sky:     { text: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     glow: 'rgba(56,189,248,0.12)' },
  }
  const c = colors[color]
  return (
    <div className={`stat-card card-hover relative overflow-hidden border ${isActive ? c.border : 'border-surface-600/40'} transition-all duration-500`}
      style={isActive ? { boxShadow: `0 0 40px ${c.glow}, 0 4px 24px rgba(0,0,0,0.4)` } : {}}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <span className={c.text}>{icon}</span>
        </div>
        {isActive && value > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-','bg-')} animate-pulse`} />
            <span className="font-mono text-[10px] text-zinc-500 tracking-wide">LIVE</span>
          </div>
        )}
      </div>
      <div className={`font-display font-bold text-4xl leading-none mb-1 ${isActive && value > 0 ? c.text : 'text-white'} transition-colors duration-500`}>{animated.toLocaleString()}</div>
      <div className="font-mono text-xs text-zinc-500 tracking-wide uppercase mt-2">{label}</div>
      <div className="text-xs text-zinc-600 mt-1">{description}</div>
    </div>
  )
}

export default function StatsCards({ stats, isRunning, isDone }) {
  const active = isRunning || isDone
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="font-mono text-[11px] text-zinc-500 tracking-widest uppercase">Live Statistics</div>
        {(isRunning || isDone) && (
          <div className={`badge ${isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-brand-500/10 text-brand-300 border border-brand-500/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-brand-400'}`} />
            {isRunning ? 'Crawler Running…' : 'Crawl Completed'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pages Crawled" value={stats.pages} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" opacity="0.4"/><line x1="7" y1="8" x2="17" y2="8" strokeLinecap="round"/><line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round"/><line x1="7" y1="16" x2="13" y2="16" strokeLinecap="round"/></svg>} color="sky" description="HTML pages scanned" isActive={active} />
        <StatCard label="PDFs Found" value={stats.pdf_found} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M4 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" opacity="0.5"/><path d="M14 4v4h4"/><path d="M8 13h3M8 16h6" strokeLinecap="round"/></svg>} color="brand" description="Documents detected" isActive={active} />
        <StatCard label="Downloaded" value={stats.downloaded} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19h18" strokeLinecap="round"/></svg>} color="emerald" description="Files saved locally" isActive={active} />
      </div>
    </div>
  )
}
