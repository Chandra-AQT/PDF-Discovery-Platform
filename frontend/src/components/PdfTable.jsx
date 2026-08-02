import { useState } from 'react'
import { BASE_URL, getZipUrl } from '../api/api'

function buildFileList(result) {
  if (!result) return []
  if (Array.isArray(result.files) && result.files.length > 0) return result.files
  const count = result.downloaded ?? result.pdf_found ?? 0
  const folder = result.folder ?? 'downloads/site'
  const base = folder.split('/').pop() ?? 'document'
  return Array.from({ length: Math.min(count, 60) }, (_, i) => ({
    name: `${base}_${String(i+1).padStart(3,'0')}.pdf`,
    path: `${folder}/${base}_${String(i+1).padStart(3,'0')}.pdf`,
    url: null,
  }))
}

export default function PdfTable({ result }) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const PER_PAGE = 10

  if (!result) return (
    <div className="card p-12 flex flex-col items-center justify-center text-center animate-fade-in">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-12 h-12 mb-4" style={{ color: '#94b8e0' }}>
        <path d="M4 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v4h4M8 13h3M8 16h6" strokeLinecap="round"/>
      </svg>
      <h3 className="font-display font-semibold mb-1" style={{ color: '#60a0d4' }}>No PDFs discovered yet</h3>
      <p className="text-sm" style={{ color: '#94b8e0' }}>Run a crawl to discover PDF documents</p>
    </div>
  )

  const zipUrl = result.zip_ready || result.zip_download ? getZipUrl() : null

  const files      = buildFileList(result)
  const filtered   = files.filter(f => (typeof f === 'string' ? f : f.name || '').toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const shown      = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const getUrl  = (f) => typeof f === 'string' ? (f.startsWith('http') ? f : `${BASE_URL}/${f}`) : f.url ? (f.url.startsWith('http') ? f.url : `${BASE_URL}${f.url}`) : `${BASE_URL}/downloads/${(f.path||'').replace(/\\/g,'/')}`
  const getName = (f) => (typeof f === 'string' ? f : f.name || f.path || '').split('/').pop()

  return (
    <div className="card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap" style={{ borderBottom: '1px solid #e2ecf9' }}>
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold" style={{ color: '#0c2d5e' }}>Discovered PDFs</h3>
          <span className="badge bg-sky-50 text-sky-700 border border-sky-200">{files.length} files</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bulk ZIP download */}
          {zipUrl && (
            <a href={zipUrl} download className="btn-primary gap-2 py-2 px-4 text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 19h18" strokeLinecap="round"/>
              </svg>
              Download All ZIP ({files.length})
            </a>
          )}
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#94b8e0' }}>
              <circle cx="11" cy="11" r="7"/><path d="m16 16 4 4" strokeLinecap="round"/>
            </svg>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Filter files…"
              style={{ background: '#f8fafc', border: '1px solid #cddcef', color: '#1e3a5f', fontFamily: 'ui-monospace,monospace', fontSize: '0.75rem', paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.375rem', paddingBottom: '0.375rem', borderRadius: '0.5rem', outline: 'none', width: '11rem', transition: 'all 200ms' }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #e2ecf9', backgroundColor: '#f8fafc' }}>
              {['#','File Name','Path','Download'].map(h => (
                <th key={h} className="px-5 py-3 text-left font-mono text-[10px] tracking-widest uppercase font-medium" style={{ color: '#94b8e0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center font-mono text-sm" style={{ color: '#94b8e0' }}>No files match your filter</td></tr>
            ) : shown.map((f, i) => {
              const idx = (page-1)*PER_PAGE+i+1
              return (
                <tr key={idx} className="group transition-colors" style={{ borderBottom: '1px solid #f0f6ff' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                  <td className="px-5 py-3.5"><span className="font-mono text-xs" style={{ color: '#94b8e0' }}>{String(idx).padStart(2,'0')}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" style={{ color: '#f43f5e' }}>
                          <path d="M4 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" opacity="0.5"/><path d="M14 4v4h4"/><path d="M8 13h4M8 16h6" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="font-mono text-xs truncate max-w-[180px]" style={{ color: '#1e3a5f' }}>{getName(f)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="font-mono text-[11px] truncate max-w-[200px] block" style={{ color: '#94b8e0' }}>{typeof f === 'object' ? f.path||f.name||'' : f}</span></td>
                  <td className="px-5 py-3.5">
                    <a href={getUrl(f)} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1 px-2.5 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 3v12M9 12l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19h18" strokeLinecap="round"/></svg>DL
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #e2ecf9' }}>
          <span className="font-mono text-xs" style={{ color: '#94b8e0' }}>{filtered.length} files · Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded-lg font-mono text-xs transition-all"
                style={p===page ? { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' } : { color: '#94b8e0', backgroundColor: 'transparent', border: '1px solid transparent' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
