import { useState, useRef, useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL    = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const HISTORY_KEY = 'docplus_history'

// ---------------------------------------------------------------------------
// Log helpers
// ---------------------------------------------------------------------------

let logId = 0
const makeLog = (level, message) => ({
  id:      ++logId,
  level,
  message,
  time:    new Date().toLocaleTimeString('en-US', { hour12: false }),
})

// ---------------------------------------------------------------------------
// History persistence
// ---------------------------------------------------------------------------

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
const saveHistory = (entries) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 50))) } catch {}
}

// ---------------------------------------------------------------------------
// Simulated log stream — runs in parallel for UX richness
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCrawler() {
  const [status,     setStatus]     = useState('idle')
  const [stats,      setStats]      = useState({ pages: 0, pdf_found: 0, downloaded: 0, total: 0, progress: 0, phase: 'idle' })
  const [logs,       setLogs]       = useState([])
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [elapsed,    setElapsed]    = useState(0)
  const [history,    setHistory]    = useState(loadHistory)

  // Refs for all teardown handles
  const esRef        = useRef(null)   // EventSource
  const timerRef     = useRef(null)   // elapsed timer
  const logTimerRef  = useRef(null)   // simulated log stream
  const startTime    = useRef(null)
  const logStageIdx  = useRef(0)

  // ── Helpers ─────────────────────────────────────────────────────────────

  const addLog = useCallback((level, message) => {
    setLogs((prev) => [...prev.slice(-200), makeLog(level, message)])
  }, [])

  const stopAll = useCallback(() => {
    // Close SSE connection if open
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
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
      } else {
        clearInterval(logTimerRef.current)
      }
    }, 1800)
  }, [addLog])

  const saveToHistory = useCallback((url, data, finalElapsed) => {
    const entry = {
      id:           Date.now(),
      url,
      date:         new Date().toISOString(),
      pdf_found:    data.pdf_found    || 0,
      downloaded:   data.downloaded   || 0,
      folder:       data.folder       || '',
      excel_file:   data.excel_file   || '',
      zip_download: data.zip_ready ? `${BASE_URL}/download-zip` : '',
      elapsed:      finalElapsed,
    }
    setHistory((prev) => {
      const next = [entry, ...prev.slice(0, 49)]
      saveHistory(next)
      return next
    })
  }, [])

  // ── Main start ───────────────────────────────────────────────────────────

  const startCrawl = useCallback((url) => {
    if (!url?.trim()) return
    const normalised = url.startsWith('http') ? url.trim() : `https://${url.trim()}`

    // Tear down any previous run
    stopAll()

    setStatus('starting')
    setCurrentUrl(normalised)
    setError(null)
    setResult(null)
    setStats({ pages: 0, pdf_found: 0, downloaded: 0, total: 0, progress: 0, phase: 'idle' })
    setLogs([])
    setElapsed(0)

    addLog('info', `Starting crawler for: ${normalised}`)
    addLog('info', 'Establishing SSE connection to backend…')

    startTime.current = Date.now()

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)

    // Start simulated log stream in parallel
    startLogStream()

    // ── Open SSE stream ──────────────────────────────────────────────
    const apiUrl = `${BASE_URL}/crawl-stream?url=${encodeURIComponent(normalised)}`
    const es     = new EventSource(apiUrl)
    esRef.current = es

    setStatus('running')

    es.onmessage = (event) => {
      let data
      try { data = JSON.parse(event.data) } catch { return }

      // ── Progress event ──────────────────────────────────────────
      if (data.type === 'progress') {
        setStats((prev) => ({
          ...prev,
          pages:      data.pages      ?? prev.pages,
          pdf_found:  data.pdf_found  ?? prev.pdf_found,
          downloaded: data.downloaded ?? prev.downloaded,
          total:      data.total      ?? prev.total,
          progress:   data.progress   ?? prev.progress,
          phase:      data.phase      || prev.phase,
        }))

        // Key milestone logs
        if (data.phase === 'crawling' && data.pages % 10 === 0 && data.pages > 0) {
          addLog('info', `Crawled ${data.pages} pages, ${data.pdf_found} PDFs found so far…`)
        }
        if (data.phase === 'downloading' && data.downloaded % 25 === 0 && data.downloaded > 0) {
          addLog('success', `Downloaded ${data.downloaded} / ${data.total} PDFs…`)
        }
        if (data.phase === 'packaging') {
          addLog('info', 'Building Excel dataset and ZIP archive…')
        }
      }

      // ── Done event ──────────────────────────────────────────────
      if (data.type === 'done') {
        es.close()
        esRef.current = null
        stopAll()

        const finalElapsed = Math.floor((Date.now() - startTime.current) / 1000)
        setElapsed(finalElapsed)

        setStats({
          pages:      data.pages      || 0,
          pdf_found:  data.pdf_found  || 0,
          downloaded: data.downloaded || 0,
          total:      data.pdf_found  || 0,
          progress:   100,
          phase:      'done',
        })
        setResult(data)
        setStatus('done')

        addLog('success', `Crawl completed in ${finalElapsed}s`)
        addLog('success', `Found ${data.pdf_found} PDFs, downloaded ${data.downloaded}`)
        if (data.excel_file) addLog('success', 'Excel dataset ready for download')
        if (data.zip_ready)  addLog('success', 'ZIP archive ready for download')

        saveToHistory(normalised, data, finalElapsed)
      }

      // ── Error event ─────────────────────────────────────────────
      if (data.type === 'error') {
        es.close()
        esRef.current = null
        stopAll()

        const finalElapsed = Math.floor((Date.now() - startTime.current) / 1000)
        setElapsed(finalElapsed)

        setStatus('error')
        setError(data.message)
        addLog('error', `Crawl failed: ${data.message}`)
      }
    }

    es.onerror = () => {
      // Only treat as a real error if we haven't already completed/errored
      // (browsers fire onerror on normal stream close too)
      if (!esRef.current) return   // already closed cleanly

      es.close()
      esRef.current = null
      stopAll()

      const finalElapsed = Math.floor((Date.now() - startTime.current) / 1000)
      setElapsed(finalElapsed)

      setStatus((prev) => {
        if (prev === 'done' || prev === 'error') return prev  // don't overwrite
        addLog('error', 'SSE connection lost — check that the backend is reachable.')
        return 'error'
      })
      setError((prev) => prev || 'Connection to backend lost.')
    }
  }, [stopAll, addLog, startLogStream, saveToHistory])

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    stopAll()
    setStatus('idle')
    setStats({ pages: 0, pdf_found: 0, downloaded: 0, total: 0, progress: 0, phase: 'idle' })
    setLogs([])
    setResult(null)
    setError(null)
    setCurrentUrl('')
    setElapsed(0)
  }, [stopAll])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopAll(), [stopAll])

  // ── Public API ───────────────────────────────────────────────────────────

  return {
    startCrawl,
    reset,
    clearHistory,
    status,
    stats,
    logs,
    result,
    error,
    currentUrl,
    elapsed,
    history,
    isIdle:    status === 'idle',
    isRunning: status === 'running' || status === 'starting',
    isDone:    status === 'done',
    isError:   status === 'error',
  }
}
