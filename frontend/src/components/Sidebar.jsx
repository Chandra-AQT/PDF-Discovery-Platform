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
      const angle = (i/12)*Math.PI*2, r = 28+Math.random()*36
      nodes.push({ x: centre.x+Math.cos(angle)*r, y: centre.y+Math.sin(angle)*r })
    }
    let tick = 0
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      nodes.slice(1).forEach((n,i) => {
        ctx.strokeStyle = `rgba(2,132,199,${isRunning ? 0.2+0.12*Math.sin(tick/20+i) : 0.1})`
        ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(centre.x,centre.y); ctx.lineTo(n.x,n.y); ctx.stroke()
        if (isRunning && tick%40===i*3) {
          const t=(tick%40)/40, px=centre.x+(n.x-centre.x)*t, py=centre.y+(n.y-centre.y)*t
          ctx.fillStyle='rgba(14,165,233,0.85)'; ctx.beginPath(); ctx.arc(px,py,1.5,0,Math.PI*2); ctx.fill()
        }
      })
      nodes.forEach((n,i) => {
        const pulse = isRunning ? 0.5+0.3*Math.sin(tick/15+i) : 0.3
        ctx.fillStyle = i===0 ? `rgba(2,132,199,${pulse+0.2})` : `rgba(14,165,233,${pulse})`
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
    <aside className="w-56 flex-shrink-0 flex flex-col h-full border-r border-blue-100"
      style={{ backgroundColor: '#ffffff' }}>
      <nav className="p-3 flex-1 space-y-0.5">
        <div className="font-mono text-[10px] text-sky-400 tracking-widest uppercase px-3 pb-2 pt-1">
          Navigation
        </div>
        {NAV_ITEMS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`sidebar-link w-full text-left ${activeTab===id?'active':''}`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab===id?'text-sky-600':'text-sky-400'}`} />
            <div className="min-w-0">
              <div className="text-sm leading-tight">{label}</div>
              <div className="text-[10px] leading-tight" style={{ color: '#94b8e0' }}>{desc}</div>
            </div>
            {id==='results' && stats.pdf_found > 0 && (
              <span className="ml-auto badge bg-sky-100 text-sky-700 border border-sky-200 text-[10px]">
                {stats.pdf_found}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Node map */}
      <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-blue-100" style={{ height:'120px', background: '#f0f6ff' }}>
        <div className="relative h-full">
          <NodeMap isRunning={isRunning} />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#94b8e0' }}>
              {isRunning ? 'CRAWLING' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="p-3 pt-0 space-y-1">
        {[['Pages',stats.pages],['PDFs Found',stats.pdf_found],['Downloaded',stats.downloaded]].map(([label,val]) => (
          <div key={label} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#f0f6ff' }}>
            <span className="font-mono text-[11px]" style={{ color: '#60a0d4' }}>{label}</span>
            <span className={`font-mono text-xs font-semibold ${val>0?'text-sky-600':'text-slate-400'}`}>{val}</span>
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
