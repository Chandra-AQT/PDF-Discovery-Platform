export default function ErrorAlert({ error, onDismiss }) {
  if (!error) return null
  const isNetwork = /network|timeout|fetch|econnrefused|unreachable/i.test(error)
  return (
    <div className="rounded-2xl overflow-hidden animate-slide-up" style={{ border: '1px solid #fecdd3', backgroundColor: '#fff1f2' }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(to right, transparent, #f43f5e, transparent)' }}/>
      <div className="flex items-start gap-4 p-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ffe4e6', border: '1px solid #fecdd3' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" style={{ color: '#f43f5e' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-sm mb-1" style={{ color: '#be123c' }}>
            {isNetwork ? 'Connection Failed' : 'Crawl Error'}
          </h4>
          <p className="font-mono text-xs leading-relaxed" style={{ color: '#e11d48' }}>{error}</p>
          {isNetwork && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge bg-white border border-rose-100 text-slate-500 text-[10px]">
                Make sure the backend is running: python main.py
              </span>
            </div>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="flex-shrink-0 p-1 rounded-lg transition-colors" style={{ color: '#94a3b8' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
