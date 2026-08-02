import { BASE_URL } from '../api/api'

export default function Header({ isRunning }) {
  const displayUrl = BASE_URL.replace(/^https?:\/\//, '')
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-surface-700/60 bg-glass sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="absolute inset-0 rounded-xl bg-brand-gradient flex items-center justify-center" style={{ boxShadow: '0 0 16px rgba(124,58,237,0.5)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {isRunning && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface-950 animate-pulse" />}
        </div>
        <div>
          <span className="font-display font-bold text-white text-sm leading-none">DocPlus</span>
          <div className="font-mono text-[10px] text-brand-400/70 tracking-widest uppercase leading-none mt-0.5">Platform v1.0</div>
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs text-emerald-400 tracking-wide">CRAWLER ACTIVE</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-700/60 border border-surface-600/40">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          <span className="font-mono text-[11px] text-zinc-500 max-w-[200px] truncate">{displayUrl}</span>
        </div>
        <div className="badge bg-surface-700 text-zinc-500 border border-surface-600/40">
          <span className="font-mono text-[10px]">REST API</span>
        </div>
      </div>
    </header>
  )
}
