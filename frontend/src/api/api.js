import axios from 'axios'

// Ensure BASE_URL always has https:// prefix
let _raw = import.meta.env.VITE_API_URL || 'http://localhost:8000'
if (_raw && !_raw.startsWith('http')) {
  _raw = 'https://' + _raw
}
export const BASE_URL = _raw.replace(/\/$/, '') // strip trailing slash

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export const crawlSite     = (url) => API.post('/crawl', { url }).then(r => r.data)
export const getStatus     = ()    => API.get('/status').then(r => r.data)
export const getExcelUrl   = ()    => `${BASE_URL}/download-excel`
export const getZipUrl     = ()    => `${BASE_URL}/download-zip`

export default API
