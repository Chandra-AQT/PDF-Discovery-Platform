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

const THEMES = {
  sky:     { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', glow: 'rgba(14,165,233,0.15)',  iconBg: '#e0f2fe' },
  blue:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', glow: 'rgba(59,130,246,0.15)',  iconBg: '#dbeafe' },
  emerald: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', glow: 'rgba(34,197,94,0.15)',   iconBg: '#dcfce7' },
}

function StatCard({ label, value, icon, color, description, isActive }) {
  const animated = useCountUp(value)
  const t = THEMES[color]
  return (
    <div
      className="stat-card card-hover relative overflow-hidden transition-all duration-500"
      style={isActive && value > 0 ? {
        backgroundColor: t.bg,
        borderColor: t.border,
        boxShadow: `0 0 0 1px ${t.border}, 0 4px 20px ${t.glow}`
      } : {}}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: t.iconBg, border: `1px solid ${t.border}` }}>
          <span style={{ color: t.text }}>{icon}</span>
        </div>
        {isActive && value > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: t.text }} />
            <span className="font-mono text-[10px] text-slate-400 tracking-wide">LIVE</span>
          </div>
        )}
      </div>
      <div className="font-display font-bold text-4xl leading-none mb-1 transition-colors duration-500"
        style={{ color: isActive && value > 0 ? t.text : '#1e3a5f' }}>
        {animated.toLocaleString()}
      </div>
      <div className="font-mono text-xs tracking-wide uppercase mt-2" style={{ color: '#64748b' }}>{label}</div>
      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{description}</div>
    </div>
  )
}

export default function StatsCards({ stats, isRunning, isDone }) {
  const active = isRunning || isDone
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="font-mono text-[11px] text-sky-400 tracking-widest uppercase">Live Statistics</div>
        {(isRunning || isDone) && (
          <div className={`badge text-xs font-mono px-3 py-1 rounded-full border ${
            isRunning
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-sky-50 text-sky-700 border-sky-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
            {isRunning ? 'Crawler Running…' : 'Crawl Completed'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pages Crawled"  value={stats.pages}      color="sky"     description="HTML pages scanned"  isActive={active}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" opacity="0.4"/><line x1="7" y1="8" x2="17" y2="8" strokeLinecap="round"/><line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round"/><line x1="7" y1="16" x2="13" y2="16" strokeLinecap="round"/></svg>} />
        <StatCard label="PDFs Found"     value={stats.pdf_found}  color="blue"    description="Documents detected"  isActive={active}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M4 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" opacity="0.5"/><path d="M14 4v4h4"/><path d="M8 13h3M8 16h6" strokeLinecap="round"/></svg>} />
        <StatCard label="Downloaded"     value={stats.downloaded} color="emerald" description="Files saved locally" isActive={active}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19h18" strokeLinecap="round"/></svg>} />
      </div>
    </div>
  )
}
