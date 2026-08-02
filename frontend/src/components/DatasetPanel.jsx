import { getExcelUrl, getZipUrl } from '../api/api'

export default function DatasetPanel({ result }) {
  if (!result) return null

  const count     = result.downloaded ?? result.pdf_found ?? 0
  const folder    = result.folder || 'downloads'
  const hasExcel  = !!(result.excel_file)
  const hasZip    = !!(result.zip_ready || result.zip_download)

  // Always use backend streaming endpoints — no static path needed
  const excelHref = getExcelUrl()
  const zipHref   = getZipUrl()

  return (
    <div className="card animate-slide-up overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0f9ff, #eff6ff)', borderColor: '#bae6fd' }}>
      <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #38bdf8, transparent)' }}/>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', boxShadow: '0 0 20px rgba(14,165,233,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6" style={{ color: '#0284c7' }}>
                <rect x="3" y="3" width="18" height="18" rx="3" opacity="0.4"/><path d="M8 12h8M8 8h5M8 16h6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-base" style={{ color: '#0c2d5e' }}>Dataset Ready</h3>
              <div className="font-mono text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: '#60a0d4' }}>
                {folder && (
                  <span className="flex items-center gap-1" style={{ color: '#94b8e0' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M2 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z"/></svg>
                    {folder}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="badge bg-slate-100 border border-slate-200 text-slate-500 text-[10px]">{count} PDFs</span>
                {hasExcel && <span className="badge bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px]">Excel ready</span>}
                {hasZip   && <span className="badge bg-sky-50 border border-sky-200 text-sky-700 text-[10px]">ZIP ready</span>}
              </div>
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex gap-3 flex-wrap">
            {hasExcel ? (
              <a href={excelHref} download className="btn-primary gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 19h18" strokeLinecap="round"/>
                </svg>
                Download Excel
              </a>
            ) : (
              <button disabled className="btn-primary opacity-40 cursor-not-allowed">Excel Not Available</button>
            )}

            {hasZip ? (
              <a href={zipHref} download className="btn-secondary gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <rect x="4" y="3" width="16" height="18" rx="2" opacity="0.5"/>
                  <path d="M8 12h8M8 16h5" strokeLinecap="round"/>
                </svg>
                Download All ZIP ({count})
              </a>
            ) : (
              <button disabled className="btn-secondary opacity-40 cursor-not-allowed">ZIP Not Available</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
