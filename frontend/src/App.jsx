import { useState } from 'react'
import Header    from './components/Header'
import Sidebar   from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import { useCrawler } from './hooks/useCrawler'

export default function App() {
  const [activeTab, setActiveTab] = useState('crawler')
  const crawler = useCrawler()

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(124,58,237,0.08) 0%, transparent 60%)' }} />
      <Header isRunning={crawler.isRunning} />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden md:flex flex-col" style={{ width: '224px', minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isRunning={crawler.isRunning} stats={crawler.stats} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div className="md:hidden flex gap-1 mb-5 bg-surface-900 border border-surface-700/60 rounded-2xl p-1 overflow-x-auto">
              {[{id:'crawler',label:'Crawler'},{id:'results',label:'Results'},{id:'charts',label:'Analytics'},{id:'history',label:'History'}].map(({id,label}) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-1 py-2 px-3 rounded-xl font-display font-medium text-sm whitespace-nowrap transition-all ${activeTab===id?'bg-brand-600/20 text-white border border-brand-600/20':'text-zinc-500 hover:text-zinc-300'}`}>{label}</button>
              ))}
            </div>
            <Dashboard crawler={crawler} activeTab={activeTab} />
          </div>
        </main>
      </div>
    </div>
  )
}
