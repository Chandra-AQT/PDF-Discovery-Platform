import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'

const BLUE    = '#0284c7'
const SKY     = '#38bdf8'
const EMERALD = '#10b981'
const INDIGO  = '#6366f1'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #bae6fd', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', boxShadow: '0 4px 16px rgba(14,72,140,0.1)' }}>
      {label && <div className="font-mono text-[11px] mb-1" style={{ color: '#94a3b8' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="font-mono text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span style={{ color: '#64748b' }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: '#0c2d5e' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-5">
      <div className="font-mono text-[11px] tracking-widest uppercase mb-4" style={{ color: '#94b8e0' }}>{title}</div>
      {children}
    </div>
  )
}

export default function Charts({ history, stats }) {
  const domainData = history.slice(0, 8).map((h) => {
    let domain = h.url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')
    if (domain.length > 14) domain = domain.slice(0, 12) + '…'
    return { domain, pdfs: h.pdf_found, downloaded: h.downloaded }
  }).reverse()

  const totalFound  = history.reduce((s, h) => s + (h.pdf_found  || 0), 0)
  const totalDl     = history.reduce((s, h) => s + (h.downloaded || 0), 0)
  const failed      = Math.max(0, totalFound - totalDl)
  const pieData     = [{ name: 'Downloaded', value: totalDl }, { name: 'Not Downloaded', value: failed }]
  const successRate = totalFound > 0 ? Math.round((totalDl / totalFound) * 100) : 0
  const trendData   = history.slice(0, 10).reverse().map((h, i) => ({ idx: `#${i+1}`, pdfs: h.pdf_found, downloaded: h.downloaded }))

  if (!history.length && stats.pdf_found === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center animate-fade-in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-12 h-12 mb-4" style={{ color: '#94b8e0' }}>
          <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
          <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
        </svg>
        <h3 className="font-display font-semibold mb-1" style={{ color: '#60a0d4' }}>No data to visualise</h3>
        <p className="text-sm" style={{ color: '#94b8e0' }}>Charts will appear after completing crawls</p>
      </div>
    )
  }

  const tickStyle = { fill: '#94a3b8', fontSize: 10 }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="PDFs per Website">
          {domainData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={domainData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ecf9" vertical={false}/>
                <XAxis dataKey="domain" tick={tickStyle} tickLine={false} axisLine={false}/>
                <YAxis tick={tickStyle} tickLine={false} axisLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="pdfs" name="PDFs Found" fill={BLUE} radius={[4,4,0,0]}/>
                <Bar dataKey="downloaded" name="Downloaded" fill={EMERALD} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center font-mono text-sm" style={{ color: '#94b8e0' }}>No history yet</div>}
        </ChartCard>

        <ChartCard title="Download Success Rate">
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="value" strokeWidth={2} stroke="#fff">
                  <Cell fill={BLUE}/><Cell fill="#e2ecf9"/>
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend formatter={(v) => <span className="font-mono text-xs" style={{ color: '#64748b' }}>{v}</span>} iconType="circle" iconSize={8}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '24px' }}>
              <div className="text-center">
                <div className="font-display font-bold text-2xl" style={{ color: '#0369a1' }}>{successRate}%</div>
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#94b8e0' }}>Success</div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {trendData.length > 1 && (
        <ChartCard title="Crawl Trend">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BLUE} stopOpacity={0.2}/><stop offset="95%" stopColor={BLUE} stopOpacity={0}/></linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={EMERALD} stopOpacity={0.15}/><stop offset="95%" stopColor={EMERALD} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ecf9" vertical={false}/>
              <XAxis dataKey="idx" tick={tickStyle} tickLine={false} axisLine={false}/>
              <YAxis tick={tickStyle} tickLine={false} axisLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="pdfs" name="PDFs Found" stroke={BLUE} fill="url(#gP)" strokeWidth={2} dot={{ fill: BLUE, r: 3 }}/>
              <Area type="monotone" dataKey="downloaded" name="Downloaded" stroke={EMERALD} fill="url(#gD)" strokeWidth={2} dot={{ fill: EMERALD, r: 3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Crawls',     value: history.length, color: '#0284c7' },
          { label: 'Total PDFs Found', value: totalFound,     color: '#6366f1' },
          { label: 'Total Downloaded', value: totalDl,        color: '#10b981' },
          { label: 'Success Rate',     value: `${successRate}%`, color: '#0369a1' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className="font-display font-bold text-2xl" style={{ color }}>{value}</div>
            <div className="font-mono text-[11px] mt-1 uppercase tracking-wide" style={{ color: '#94a3b8' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
