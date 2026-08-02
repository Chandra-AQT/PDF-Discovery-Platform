import { useState } from 'react'
import Header    from './components/Header'
import Sidebar   from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import { useCrawler } from './hooks/useCrawler'

export default function App() {
  const [activeTab, setActiveTab] = useState('crawler')
  const crawler = useCrawler()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f0f6ff 0%, #e8f4fd 50%, #f0f9ff 100%)' }}>
      {/* Ambient top glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 30% at 50% -5%, rgba(14,165,233,0.12) 0%, transparent 60%)',
        }}
      />

      <Header isRunning={crawler.isRunning} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col" style={{ width: '224px', minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isRunning={crawler.isRunning}
              stats={crawler.stats}
            />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {/* Mobile tab bar */}
            <div className="md:hidden flex gap-1 mb-5 bg-white border border-blue-100 rounded-2xl p-1 overflow-x-auto shadow-sm">
              {[
                { id: 'crawler', label: 'Crawler'   },
                { id: 'results', label: 'Results'   },
                { id: 'charts',  label: 'Analytics' },
                { id: 'history', label: 'History'   },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 py-2 px-3 rounded-xl font-display font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === id
                      ? 'bg-sky-100 text-sky-700 border border-sky-200'
                      : 'text-slate-500 hover:text-sky-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Dashboard crawler={crawler} activeTab={activeTab} />
          </div>
        </main>
      </div>
    </div>
  )
}
