import { BASE_URL } from '../api/api'

export default function DatasetPanel({ result }) {
  if (!result) return null
  const count    = result.downloaded ?? result.pdf_found ?? 0
  const folder   = result.folder || 'downloads'
  const excelUrl = result.excel_file ? (result.excel_file.startsWith('http') ? result.excel_file : `${BASE_URL}${result.excel_file}`) : null
  const zipUrl   = result.zip_download ? (result.zip_download.startsWith('http') ? result.zip_download : `${BASE_URL}${result.zip_download}`) : null
  const excelName = excelUrl ? excelUrl.split('/').pop() : ''

  return (
    <div className="card animate-slide-up overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(79,70,229,0.04))', borderColor: 'rgba(139,92,246,0.2)' }}>
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 24px rgba(139,92,246,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6 text-brand-400">
                <rect x="3" y="3" width="18" height="18" rx="3" opacity="0.4" /><path d="M8 12h8M8 8h5M8 16h6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Dataset Ready</h3>
              <div className="font-mono text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
                {excelName && <span className="truncate max-w-[200px]">{excelName}</span>}
                {folder && <span className="flex items-center gap-1 text-zinc-600"><svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M2 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z" /></svg>{folder}</span>}
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="badge bg-surface-700 border border-surface-600/40 text-zinc-400 text-[10px]">{count} PDFs catalogued</span>
                {excelUrl && <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">Excel ready</span>}
                {zipUrl   && <span className="badge bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px]">ZIP ready</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {excelUrl ? (
              <a href={excelUrl} target="_blank" rel="noopener noreferrer" className="btn-primary gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 19h18" strokeLinecap="round" /></svg>
                Download Excel
              </a>
            ) : <button disabled className="btn-primary opacity-40 cursor-not-allowed gap-2.5">Excel Not Available</button>}
            {zipUrl ? (
              <a href={zipUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="4" y="3" width="16" height="18" rx="2" opacity="0.5" /><path d="M8 12h8M8 16h5" strokeLinecap="round" /></svg>
                Download ZIP
              </a>
            ) : <button disabled className="btn-secondary opacity-40 cursor-not-allowed gap-2.5">ZIP Not Available</button>}
          </div>
        </div>
        {(excelUrl || zipUrl) && (
          <div className="mt-4 pt-4 border-t border-surface-700/40 grid gap-1.5">
            {excelUrl && <UrlStrip label="Excel" url={excelUrl} />}
            {zipUrl   && <UrlStrip label="ZIP  " url={zipUrl} />}
          </div>
        )}
      </div>
    </div>
  )
}

function UrlStrip({ label, url }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className="text-zinc-600 flex-shrink-0">{label}</span>
      <span className="flex-1 truncate text-zinc-500" title={url}>{url}</span>
      <button onClick={() => navigator.clipboard?.writeText(url)} title="Copy URL" className="flex-shrink-0 text-zinc-700 hover:text-brand-400 transition-colors p-0.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      </button>
    </div>
  )
}
