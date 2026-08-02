export default function ErrorAlert({ error, onDismiss }) {
  if (!error) return null
  const isNetwork = /network|timeout|fetch|econnrefused|unreachable/i.test(error)
  return (
    <div className="rounded-2xl border border-red-500/25 bg-red-500/5 overflow-hidden animate-slide-up">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      <div className="flex items-start gap-4 p-5">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" /><circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-red-400 text-sm mb-1">{isNetwork ? 'Connection Failed' : 'Crawl Error'}</h4>
          <p className="font-mono text-xs text-red-300/60 leading-relaxed">{error}</p>
          {isNetwork && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge bg-surface-700 border border-surface-600/40 text-zinc-500 text-[10px]">Make sure the backend is running: python main.py</span>
            </div>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-surface-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}
