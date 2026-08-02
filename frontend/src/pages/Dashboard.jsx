import CrawlerInput  from '../components/CrawlerInput'
import StatsCards    from '../components/StatsCards'
import LogsPanel     from '../components/LogsPanel'
import PdfTable      from '../components/PdfTable'
import DatasetPanel  from '../components/DatasetPanel'
import HistoryPanel  from '../components/HistoryPanel'
import Charts        from '../components/Charts'
import ErrorAlert    from '../components/ErrorAlert'

export default function Dashboard({ crawler, activeTab }) {
  const {
    startCrawl, reset, clearHistory,
    status, stats, logs, result, error,
    currentUrl, elapsed, history,
    isRunning, isDone, isError,
  } = crawler

  // Show stats whenever something is happening or has happened
  const showStats = isRunning || isDone || isError || status === 'starting'

  if (activeTab === 'crawler') {
    return (
      <div className="space-y-5">
        {/* Input always on top */}
        <CrawlerInput
          onStart={startCrawl}
          isRunning={isRunning}
          isDone={isDone}
          currentUrl={currentUrl}
          elapsed={elapsed}
          progress={stats.progress || 0}
          phase={stats.phase || ''}
        />

        {isError && <ErrorAlert error={error} onDismiss={reset} />}

        {/* Stats appear immediately when crawl starts, stay visible after done */}
        {showStats && (
          <StatsCards
            stats={stats}
            isRunning={isRunning}
            isDone={isDone}
            status={status}
          />
        )}

        {/* Logs appear as soon as there are entries */}
        {(isRunning || isDone || logs.length > 0) && (
          <LogsPanel logs={logs} isRunning={isRunning} />
        )}

        {isDone && result && <DatasetPanel result={result} />}
      </div>
    )
  }

  if (activeTab === 'results') {
    return (
      <div className="space-y-5">
        {isDone && result && <DatasetPanel result={result} />}
        <PdfTable result={result} />
        {!result && !isRunning && (
          <div className="card p-10 text-center font-mono text-sm" style={{ color: '#94b8e0' }}>
            Run a crawl from the Crawler tab to see results here.
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'charts') {
    return (
      <div className="space-y-5">
        <Charts history={history} stats={stats} />
      </div>
    )
  }

  if (activeTab === 'history') {
    return (
      <div className="space-y-5">
        <HistoryPanel
          history={history}
          onRerun={(url) => startCrawl(url)}
          onClear={clearHistory}
        />
      </div>
    )
  }

  return null
}
