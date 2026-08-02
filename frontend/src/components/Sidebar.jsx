import { useEffect, useRef } from 'react'

const NAV_ITEMS = [
  { id: 'crawler', label: 'Crawler',   icon: RadarIcon,   desc: 'Start crawl' },
  { id: 'results', label: 'Results',   icon: FilesIcon,   desc: 'PDFs found'  },
  { id: 'charts',  label: 'Analytics', icon: ChartIcon,   desc: 'Visualise'   },
  { id: 'history', label: 'History',   icon: HistoryIcon, desc: 'Past crawls' },
]

function NodeMap({ isRunning }) {
  const canvasRef = useRef(null), animRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth, H = canvas.height = canvas.offsetHeight
    const centre = { x: W/2, y: H/2 }
    const nodes = [centre]
    for (let i = 0; i < 12; i++) {
      const angle = (i/12)*Math.PI*2, r = 30+Math.random()*40
      nodes.push({ x: centre.x+Math.cos(angle)*r, y: centre.y+Math.sin(angle)*r })
    }
    let tick = 0
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      nodes.slice(1).forEach((n,i) => {
        ctx.strokeStyle = `rgba(139,92,246,${isRunning ? 0.15+0.1*Math.sin(tick/20+i) : 0.06})`
        ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(centre.x,centre.y); ctx.lineTo(n.x,n.y); ctx.stroke()
        if (isRunning && tick%40===i*3) {
          const t=(tick%40)/40, px=centre.x+(n.x-centre.x)*t, py=centre.y+(n.y-centre.y)*t
          ctx.fillStyle='rgba(167,139,250,0.9)'; ctx.beginPath(); ctx.arc(px,py,1.5,0,Math.PI*2); ctx.fill()
        }
      })
      nodes.forEach((n,i) => {
        const pulse = isRunning ? 0.4+0.3*Math.sin(tick/15+i) : 0.2
        ctx.fillStyle = i===0 ? `rgba(139,92,246,${pulse+0.3})` : `rgba(99,66,200,${pulse})`
        ctx.beginPath(); ctx.arc(n.x,n.y,i===0?4:2,0,Math.PI*2); ctx.fill()
      })
      tick++; animRef.current = requestAnimationFrame(draw)
    }
    draw(); return () => cancelAnimationFrame(animRef.current)
  }, [isRunning])
  return <canvas ref={canvasRef} className="w-full h-full" />
}

export default function Sidebar({ activeTab, setActiveTab, isRunning, stats }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-surface-900 border-r border-surface-700/60 flex flex-col h-full">
      <nav className="p-3 flex-1 space-y-0.5">
        <div className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase px-3 pb-2 pt-1">Navigation</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon, desc }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`sidebar-link w-full text-left ${activeTab===id?'active':''}`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab===id?'text-brand-400':'text-zinc-600'}`} />
            <div className="min-w-0">
              <div className="text-sm leading-tight">{label}</div>
              <div className="text-[10px] text-zinc-600 leading-tight">{desc}</div>
            </div>
            {id==='results' && stats.pdf_found > 0 && (
              <span className="ml-auto badge bg-brand-600/20 text-brand-300 border border-brand-600/20 text-[10px]">{stats.pdf_found}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-surface-700/40" style={{ height:'120px' }}>
        <div className="relative h-full bg-surface-950/80">
          <NodeMap isRunning={isRunning} />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">{isRunning?'CRAWLING':'STANDBY'}</span>
          </div>
        </div>
      </div>
      <div className="p-3 pt-0 space-y-1">
        {[['Pages',stats.pages],['PDFs Found',stats.pdf_found],['Downloaded',stats.downloaded]].map(([label,val]) => (
          <div key={label} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-800/60">
            <span className="font-mono text-[11px] text-zinc-500">{label}</span>
            <span className={`font-mono text-xs font-semibold ${val>0?'text-brand-300':'text-zinc-600'}`}>{val}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function RadarIcon({ className }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="9" opacity="0.4"/><circle cx="12" cy="12" r="4" opacity="0.7"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="3" x2="12" y2="8" strokeLinecap="round"/></svg> }
function FilesIcon({ className }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M3 6h18M3 12h18M3 18h12" strokeLinecap="round"/></svg> }
function ChartIcon({ className }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg> }
function HistoryIcon({ className }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
