import { useState, useRef, useCallback, useEffect } from 'react'
import { crawlSite, getStatus } from '../api/api'

const POLL_MS = 1000  // poll every 1s for responsive live stats
const HISTORY_KEY = 'docplus_history'

let logId = 0
const makeLog = (level, message) => ({
  id: ++logId,
  level,
  message,
  time: new Date().toLocaleTimeString('en-US', { hour12: false }),
})

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
const saveHistory = (entries) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 50))) } catch {}
}

const CRAWL_LOG_STAGES = [
  ['info',    'Initialising crawler engine…'],
  ['info',    'Establishing connection to target host…'],
  ['info',    'Fetching root page HTML…'],
  ['info',    'Parsing anchor tags and link graph…'],
  ['info',    'Resolving relative URLs…'],
  ['info',    'Queuing internal links for traversal…'],
  ['info',    'Scanning page 1 of N…'],
  ['info',    'Detecting content-type headers…'],
  ['info',    'Identified potential PDF resource…'],
  ['success', 'PDF found — adding to download queue…'],
  ['info',    'Scanning next page…'],
  ['info',    'Following redirect chain…'],
  ['success', 'PDF found — queuing for download…'],
  ['info',    'Downloading binary stream…'],
  ['success', 'File saved to local storage…'],
  ['info',    'Deduplicating discovered links…'],
  ['info',    'Crawling subpages…'],
  ['success', 'PDF found — adding to registry…'],
  ['info',    'Downloading file…'],
  ['success', 'Download complete…'],
  ['info',    'Generating Excel dataset…'],
  ['success', 'Excel file created successfully…'],
  ['info',    'Packaging ZIP archive…'],
  ['success', 'ZIP archive ready for download…'],
]

export function useCrawler() {
  const [status, setStatus]         = useState('idle')
  const [stats, setStats]           = useState({ pages: 0, pdf_found: 0, downloaded: 0 })
  const [logs, setLogs]             = useState([])
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [elapsed, setElapsed]       = useState(0)
  const [history, setHistory]       = useState(loadHistory)

  const pollRef     = useRef(null)
  const timerRef    = useRef(null)
  const logTimerRef = useRef(null)
  const startTime   = useRef(null)
  const logStageIdx = useRef(0)

  const addLog = useCallback((level, message) => {
    setLogs((prev) => [...prev.slice(-200), makeLog(level, message)])
  }, [])

  const stopAll = useCallback(() => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
    clearInterval(logTimerRef.current)
  }, [])

  const startLogStream = useCallback(() => {
    logStageIdx.current = 0
    logTimerRef.current = setInterval(() => {
      const idx = logStageIdx.current
      if (idx < CRAWL_LOG_STAGES.length) {
        const [level, msg] = CRAWL_LOG_STAGES[idx]
        addLog(level, msg)
        logStageIdx.current = idx + 1
      }
    }, 1800)
  }, [addLog])

  const startPolling = useCallback(() => {
    // Immediate first poll so stats show instantly
    const poll = async () => {
      try {
        const s = await getStatus()
        setStats({ pages: s.pages || 0, pdf_found: s.pdf_found || 0, downloaded: s.downloaded || 0 })
      } catch {}
    }
    poll()
    pollRef.current = setInterval(poll, POLL_MS)
  }, [])

  const startCrawl = useCallback(async (url) => {
    if (!url?.trim()) return
    const normalised = url.startsWith('http') ? url.trim() : `https://${url.trim()}`

    stopAll()
    setStatus('starting')
    setCurrentUrl(normalised)
    setError(null)
    setResult(null)
    setStats({ pages: 0, pdf_found: 0, downloaded: 0 })
    setLogs([])
    setElapsed(0)

    addLog('info', `Starting crawler for: ${normalised}`)
    addLog('info', 'Resolving DNS and establishing connection…')

    startTime.current = Date.now()
    timerRef.current  = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)

    startPolling()
    setTimeout(() => { setStatus('running'); startLogStream() }, 600)

    try {
      const data = await crawlSite(normalised)
      stopAll()

      try {
        const s = await getStatus()
        setStats({
          pages:      s.pages      || 0,
          pdf_found:  data.pdf_found  || s.pdf_found  || 0,
          downloaded: data.downloaded || s.downloaded || 0,
        })
      } catch {
        setStats({ pages: 0, pdf_found: data.pdf_found || 0, downloaded: data.downloaded || 0 })
      }

      const finalElapsed = Math.floor((Date.now() - startTime.current) / 1000)
      setElapsed(finalElapsed)
      setResult(data)
      setStatus('done')

      addLog('success', `Crawl completed in ${finalElapsed}s`)
      addLog('success', `Found ${data.pdf_found} PDFs, downloaded ${data.downloaded}`)
      if (data.excel_file)   addLog('success', 'Excel dataset ready for download')
      if (data.zip_download) addLog('success', 'ZIP archive ready for download')

      const entry = {
        id: Date.now(), url: normalised, date: new Date().toISOString(),
        pdf_found: data.pdf_found || 0, downloaded: data.downloaded || 0,
        folder: data.folder || '', excel_file: data.excel_file || '',
        zip_download: data.zip_download || '', elapsed: finalElapsed,
      }
      setHistory((prev) => { const next = [entry, ...prev.slice(0, 49)]; saveHistory(next); return next })
    } catch (err) {
      stopAll()
      setStatus('error')
      setError(err.message)
      addLog('error', `Crawl failed: ${err.message}`)
      if (/network|timeout|econnrefused/i.test(err.message))
        addLog('warn', 'Tip: Make sure the backend is running on http://localhost:8000')
    }
  }, [stopAll, addLog, startPolling, startLogStream])

  const reset = useCallback(() => {
    stopAll()
    setStatus('idle')
    setStats({ pages: 0, pdf_found: 0, downloaded: 0 })
    setLogs([]); setResult(null); setError(null); setCurrentUrl(''); setElapsed(0)
  }, [stopAll])

  const clearHistory = useCallback(() => { setHistory([]); saveHistory([]) }, [])

  useEffect(() => () => stopAll(), [stopAll])

  return {
    startCrawl, reset, clearHistory, status, stats, logs, result, error,
    currentUrl, elapsed, history,
    isIdle: status === 'idle', isRunning: status === 'running' || status === 'starting',
    isDone: status === 'done', isError: status === 'error',
  }
}
