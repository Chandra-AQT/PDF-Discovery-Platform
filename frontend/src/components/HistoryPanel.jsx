import { BASE_URL } from '../api/api'

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) } catch { return iso } }

export default function HistoryPanel({ history, onRerun, onClear }) {
  if (!history.length) return (
    <div className="card p-12 flex flex-col items-center justify-center text-center animate-fade-in">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-12 h-12 text-zinc-700 mb-4">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h3 className="font-display font-semibold text-zinc-500 mb-1">No crawl history yet</h3>
      <p className="text-zinc-600 text-sm">Completed crawls will be saved here automatically</p>
    </div>
  )

  return (
    <div className="card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700/60">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-white">Crawl History</h3>
          <span className="badge bg-surface-700 border border-surface-600/40 text-zinc-500">{history.length}</span>
        </div>
        <button onClick={onClear} className="btn-secondary py-1.5 px-3 text-xs gap-1.5 text-red-400/70 hover:text-red-400 border-red-500/10 hover:border-red-500/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/></svg>Clear
        </button>
      </div>
      <div className="divide-y divide-surface-700/30">
        {history.map((entry) => {
          const excelUrl = entry.excel_file ? (entry.excel_file.startsWith('http') ? entry.excel_file : `${BASE_URL}${entry.excel_file}`) : null
          return (
            <div key={entry.id} className="px-5 py-4 hover:bg-surface-700/20 transition-colors group flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-brand-400"><circle cx="12" cy="12" r="9" opacity="0.4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-white/90 truncate">{entry.url}</div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="font-mono text-[11px] text-zinc-600">{fmt(entry.date)}</span>
                  {entry.elapsed > 0 && <span className="font-mono text-[11px] text-zinc-600">{entry.elapsed < 60 ? `${entry.elapsed}s` : `${Math.floor(entry.elapsed/60)}m`}</span>}
                  <span className="badge bg-brand-600/10 text-brand-400 border border-brand-600/15 text-[10px]">{entry.pdf_found} PDFs</span>
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[10px]">{entry.downloaded} DL</span>
                </div>
                {entry.folder && <div className="font-mono text-[11px] text-zinc-700 mt-1 truncate">📁 {entry.folder}</div>}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRerun(entry.url)} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.59" strokeLinecap="round"/></svg>Re-run
                </button>
                {excelUrl && (
                  <a href={excelUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-xs gap-1.5 text-emerald-400/80 border-emerald-500/15 hover:border-emerald-500/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19h18" strokeLinecap="round"/></svg>Excel
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
