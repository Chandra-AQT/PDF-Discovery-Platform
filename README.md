# DocPlus

A full-stack web platform that crawls any website, discovers all `.pdf` documents, downloads them into organized folders, and delivers them with an Excel index and ZIP archive.

## Project Structure

```
DocPlus/
├── backend/          ← Python / FastAPI
│   ├── main.py           entry point  →  python main.py
│   ├── server.py         FastAPI routes (/crawl, /status)
│   ├── crawler_service.py   multi-threaded BFS web crawler
│   ├── download_service.py  parallel PDF downloader
│   ├── excel_service.py     Excel report generator
│   ├── zip_service.py       ZIP packager
│   ├── registry_service.py  deduplication registry
│   ├── requirements.txt
│   └── downloads/           saved PDFs (auto-created per domain)
│
└── frontend/         ← React / Vite / Tailwind
    ├── src/
    │   ├── api/api.js        Axios client (points to localhost:8000)
    │   ├── hooks/useCrawler.js  crawl state machine
    │   ├── components/       Header, Sidebar, CrawlerInput, StatsCards,
    │   │                     LogsPanel, PdfTable, DatasetPanel,
    │   │                     HistoryPanel, Charts, ErrorAlert
    │   └── pages/Dashboard.jsx
    └── package.json
```

## Running Locally

**Backend** (terminal 1)
```bash
cd backend
pip install -r requirements.txt
python main.py
# API → http://localhost:8000
```

**Frontend** (terminal 2)
```bash
cd frontend
npm install       # first time only
npm run dev
# UI  → http://localhost:5173
```

## How It Works

1. Paste any website URL into the UI (e.g. `https://www.redmi.com`)
2. The backend crawls up to 200 pages following all internal links
3. Every `.pdf` link found is downloaded in parallel into `backend/downloads/<domain>/`
4. An Excel file listing all PDF URLs is created inside that folder
5. Everything is zipped for one-click download from the UI

## Deployment

| Service  | Platform |
|----------|----------|
| Backend  | Railway  |
| Frontend | Vercel   |

**Environment variables:**
- Railway → `ALLOWED_ORIGINS=https://your-app.vercel.app`
- Vercel  → `VITE_API_URL=https://your-app.up.railway.app`
