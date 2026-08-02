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

  if (activeTab === 'crawler') {
    return (
      <div className="space-y-5">
        <CrawlerInput onStart={startCrawl} isRunning={isRunning} isDone={isDone} currentUrl={currentUrl} elapsed={elapsed} />
        {isError && <ErrorAlert error={error} onDismiss={reset} />}
        {(isRunning || isDone || isError) && <StatsCards stats={stats} isRunning={isRunning} isDone={isDone} status={status} />}
        {(isRunning || logs.length > 0) && <LogsPanel logs={logs} isRunning={isRunning} />}
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
          <div className="text-center pt-4 text-zinc-600 font-mono text-sm">
            Run a crawl from the Crawler tab to see results here.
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'charts') {
    return <div className="space-y-5"><Charts history={history} stats={stats} /></div>
  }

  if (activeTab === 'history') {
    return (
      <div className="space-y-5">
        <HistoryPanel history={history} onRerun={(url) => startCrawl(url)} onClear={clearHistory} />
      </div>
    )
  }

  return null
}
