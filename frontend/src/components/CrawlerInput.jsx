import { useState, useRef, useEffect } from 'react'

const EXAMPLE_URLS = ['samsung.com/support', 'intel.com/content/dam', 'amd.com/resources', 'nvidia.com/drivers']

export default function CrawlerInput({ onStart, isRunning, isDone, currentUrl, elapsed, progress = 0, phase = '' }) {
  const [url, setUrl]     = useState('')
  const [error, setError] = useState('')
  const inputRef          = useRef(null)

  const currentPhase = {
    crawling:    'Crawling pages…',
    downloading: 'Downloading PDFs…',
    packaging:   'Packaging Excel…',
    done:        'Complete!',
  }[phase] || 'Processing…'

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
          <h2 className="font-display font-bold text-lg leading-tight" style={{ color: '#0c2d5e' }}>Start New Crawl</h2>
          <p className="text-sm mt-0.5" style={{ color: '#60a0d4' }}>
            Enter a manufacturer or documentation website to scan for PDFs
          </p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
            <svg className="w-4 h-4 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
            </svg>
            <span className="font-mono">{fmt(elapsed)}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs pointer-events-none select-none" style={{ color: '#38bdf8' }}>
            https://
          </span>
          <input ref={inputRef} type="text" value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleSubmit(e)}
            placeholder="manufacturer.com/support/manuals"
            disabled={isRunning}
            className={`input-base pl-20 ${error ? 'border-red-300' : ''}`}
          />
          {url && !isRunning && (
            <button type="button" onClick={() => { setUrl(''); setError('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
              style={{ color: '#94b8e0' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <button type="submit" disabled={isRunning} className="btn-primary px-6 gap-2.5">
          {isRunning ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
            </svg>Crawling…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="9" opacity="0.4"/>
              <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
              <line x1="12" y1="3" x2="12" y2="8" strokeLinecap="round"/>
            </svg>{isDone ? 'New Crawl' : 'Start Crawl'}</>
          )}
        </button>
      </form>

      {error && (
        <p className="mt-2 font-mono text-xs text-red-500 flex items-center gap-1.5 animate-fade-in">
          <span>⚠</span>{error}
        </p>
      )}

      {isRunning && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-sky-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"/>
              {currentPhase}
            </span>
            <span className="font-mono text-xs font-semibold" style={{ color: '#0284c7' }}>
              {progress}%
            </span>
          </div>
          {/* Real percentage progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e0f2fe' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                boxShadow: '0 0 8px rgba(2,132,199,0.4)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-[10px]" style={{ color: '#94b8e0' }}>
            <span>{currentUrl}</span>
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[11px]" style={{ color: '#94b8e0' }}>Try:</span>
          {EXAMPLE_URLS.map((u) => (
            <button key={u} onClick={() => { setUrl(u); setError('') }}
              className="font-mono text-[11px] transition-colors px-2 py-1 rounded-md border"
              style={{ color: '#4a7aab', backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
