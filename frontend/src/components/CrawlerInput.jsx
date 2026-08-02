import { useState, useRef, useEffect } from 'react'

const EXAMPLE_URLS = ['samsung.com/support', 'intel.com/content/dam', 'amd.com/resources', 'nvidia.com/drivers']

export default function CrawlerInput({ onStart, isRunning, isDone, currentUrl, elapsed }) {
  const [url, setUrl]     = useState('')
  const [error, setError] = useState('')
  const inputRef          = useRef(null)

  useEffect(() => { if (!isRunning) inputRef.current?.focus() }, [isRunning])

  const validate = (v) => {
    if (!v.trim()) return 'Please enter a website URL'
    try { new URL(v.startsWith('http') ? v : `https://${v}`); return '' }
    catch { return 'Enter a valid URL, e.g. example.com' }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate(url)
    if (err) { setError(err); return }
    setError(''); onStart(url.trim())
  }

  const fmt = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`

  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-white text-lg leading-tight">Start New Crawl</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Enter a manufacturer or documentation website to scan for PDFs</p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <svg className="w-4 h-4 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
            <span className="font-mono">{fmt(elapsed)}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-brand-500/70 pointer-events-none select-none">https://</span>
          <input ref={inputRef} type="text" value={url} onChange={(e) => { setUrl(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleSubmit(e)}
            placeholder="manufacturer.com/support/manuals" disabled={isRunning}
            className={`input-base pl-20 ${error ? 'border-red-500/50' : ''}`} />
          {url && !isRunning && (
            <button type="button" onClick={() => { setUrl(''); setError('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        <button type="submit" disabled={isRunning} className="btn-primary px-6 gap-2.5">
          {isRunning ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>Crawling…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="9" opacity="0.4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><line x1="12" y1="3" x2="12" y2="8" strokeLinecap="round" /></svg>{isDone ? 'New Crawl' : 'Start Crawl'}</>
          )}
        </button>
      </form>

      {error && <p className="mt-2 font-mono text-xs text-red-400 flex items-center gap-1.5 animate-fade-in"><span>⚠</span>{error}</p>}

      {isRunning && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs text-brand-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />Crawling in progress…</span>
            <span className="font-mono text-xs text-zinc-600 truncate max-w-xs">{currentUrl}</span>
          </div>
          <div className="h-0.5 bg-surface-700 rounded-full overflow-hidden">
            <div className="h-full shimmer-bg animate-shimmer rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[11px] text-zinc-600">Try:</span>
          {EXAMPLE_URLS.map((u) => (
            <button key={u} onClick={() => { setUrl(u); setError('') }}
              className="font-mono text-[11px] text-zinc-500 hover:text-brand-300 transition-colors bg-surface-700/40 px-2 py-1 rounded-md border border-surface-600/30 hover:border-brand-600/30">{u}</button>
          ))}
        </div>
      )}
    </div>
  )
}
