import { useState } from 'react'
import { BASE_URL } from '../api/api'

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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-12 h-12 text-zinc-700 mb-4">
        <path d="M4 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M14 4v4h4M8 13h3M8 16h6" strokeLinecap="round" />
      </svg>
      <h3 className="font-display font-semibold text-zinc-500 mb-1">No PDFs discovered yet</h3>
      <p className="text-zinc-600 text-sm">Run a crawl to discover PDF documents</p>
    </div>
  )

  const files      = buildFileList(result)
  const filtered   = files.filter(f => (typeof f === 'string' ? f : f.name || '').toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const shown      = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const getUrl  = (f) => typeof f === 'string' ? (f.startsWith('http') ? f : `${BASE_URL}/${f}`) : f.url ? (f.url.startsWith('http') ? f.url : `${BASE_URL}${f.url}`) : `${BASE_URL}/downloads/${(f.path||'').replace(/\\/g,'/')}`
  const getName = (f) => (typeof f === 'string' ? f : f.name || f.path || '').split('/').pop()

  return (
    <div className="card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700/60 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-white">Discovered PDFs</h3>
          <span className="badge bg-brand-600/20 text-brand-300 border border-brand-600/20">{files.length} files</span>
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4" strokeLinecap="round"/></svg>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Filter files…"
            className="bg-surface-900 border border-surface-600/60 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-600 outline-none focus:border-brand-500/50 w-44 transition-all" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/40">
              {['#','File Name','Path','Download'].map(h => (
                <th key={h} className="px-5 py-3 text-left font-mono text-[10px] text-zinc-600 tracking-widest uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-600 font-mono text-sm">No files match your filter</td></tr>
            ) : shown.map((f, i) => {
              const idx = (page-1)*PER_PAGE+i+1
              return (
                <tr key={idx} className="border-b border-surface-700/30 hover:bg-surface-700/30 transition-colors group">
                  <td className="px-5 py-3.5"><span className="font-mono text-xs text-zinc-600">{String(idx).padStart(2,'0')}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-red-400">
                          <path d="M4 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" opacity="0.5"/><path d="M14 4v4h4"/><path d="M8 13h4M8 16h6" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="font-mono text-xs text-zinc-300 truncate max-w-[180px]">{getName(f)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="font-mono text-[11px] text-zinc-600 truncate max-w-[200px] block">{typeof f === 'object' ? f.path||f.name||'' : f}</span></td>
                  <td className="px-5 py-3.5">
                    <a href={getUrl(f)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 btn-secondary py-1 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-700/60">
          <span className="font-mono text-xs text-zinc-600">{filtered.length} files · Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg font-mono text-xs transition-all ${p===page ? 'bg-brand-600/30 text-brand-300 border border-brand-600/30' : 'text-zinc-600 hover:text-zinc-300 hover:bg-surface-700'}`}>{p}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
