import { BASE_URL } from '../api/api'

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) } catch { return iso } }

export default function HistoryPanel({ history, onRerun, onClear }) {
  if (!history.length) return (
    <div className="card p-12 flex flex-col items-center justify-center text-center animate-fade-in">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-12 h-12 mb-4" style={{ color: '#94b8e0' }}>
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h3 className="font-display font-semibold mb-1" style={{ color: '#60a0d4' }}>No crawl history yet</h3>
      <p className="text-sm" style={{ color: '#94b8e0' }}>Completed crawls will be saved here automatically</p>
    </div>
  )

  return (
    <div className="card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e2ecf9' }}>
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold" style={{ color: '#0c2d5e' }}>Crawl History</h3>
          <span className="badge bg-slate-100 border border-slate-200 text-slate-500">{history.length}</span>
        </div>
        <button onClick={onClear} className="btn-secondary py-1.5 px-3 text-xs gap-1.5" style={{ color: '#ef4444', borderColor: '#fecdd3' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/></svg>Clear
        </button>
      </div>
      <div style={{ divide: 'y' }}>
        {history.map((entry) => {
          const excelUrl = entry.excel_file ? (entry.excel_file.startsWith('http') ? entry.excel_file : `${BASE_URL}${entry.excel_file}`) : null
          const zipUrl   = entry.zip_download ? (entry.zip_download.startsWith('http') ? entry.zip_download : `${BASE_URL}${entry.zip_download}`) : null
          return (
            <div key={entry.id} className="group px-5 py-4 flex items-center gap-4 transition-colors"
              style={{ borderBottom: '1px solid #f0f6ff' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" style={{ color: '#0284c7' }}>
                  <circle cx="12" cy="12" r="9" opacity="0.4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm truncate" style={{ color: '#0c2d5e' }}>{entry.url}</div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="font-mono text-[11px]" style={{ color: '#94b8e0' }}>{fmt(entry.date)}</span>
                  {entry.elapsed > 0 && <span className="font-mono text-[11px]" style={{ color: '#94b8e0' }}>{entry.elapsed < 60 ? `${entry.elapsed}s` : `${Math.floor(entry.elapsed/60)}m`}</span>}
                  <span className="badge bg-sky-50 text-sky-700 border border-sky-100 text-[10px]">{entry.pdf_found} PDFs</span>
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px]">{entry.downloaded} DL</span>
                </div>
                {entry.folder && <div className="font-mono text-[11px] mt-1 truncate" style={{ color: '#94b8e0' }}>📁 {entry.folder}</div>}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRerun(entry.url)} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.59" strokeLinecap="round"/></svg>Re-run
                </button>
                {excelUrl && (
                  <a href={excelUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-xs gap-1.5" style={{ color: '#15803d', borderColor: '#bbf7d0' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19h18" strokeLinecap="round"/></svg>Excel
                  </a>
                )}
                {zipUrl && (
                  <a href={zipUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-xs gap-1.5" style={{ color: '#0369a1', borderColor: '#bae6fd' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19h18" strokeLinecap="round"/></svg>ZIP
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
