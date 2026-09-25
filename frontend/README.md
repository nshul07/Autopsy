# AppAutopsy — Frontend

A React + Vite + Tailwind frontend for AppAutopsy: scan an Android APK or a
suspicious download link before installing, get a plain-language risk score
in English, Hindi or Punjabi.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

The UI works fully standalone via **Try demo scan** on the home page, even
with no backend running — useful for the pitch if the API or Wi-Fi drops.

## Connect it to the FastAPI backend

The frontend expects the backend described in `AGENTS.md` / the project
docs, exposing:

```
POST /api/v1/apk/analyze     (multipart/form-data: file, category?, language)
POST /api/v1/link/check      (json: { url, language })
GET  /api/v1/report/{id}
```

1. Copy `.env.example` to `.env` and set the backend URL:

   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

   If unset, the app defaults to `http://localhost:8000`.

2. Start the FastAPI backend (see the backend's own README / `AGENTS.md`),
   with CORS enabled for the Vite dev origin (`http://localhost:5173`).

3. Run `npm run dev`. The **Scan APK** and **Check Link** flows will call
   the real API; if a request fails (network error, backend down), the APK
   flow shows a retry/demo error state, and the link flow silently falls
   back to demo data so the UI stays presentable mid-demo.

All API calls are isolated in `src/api.js` (`analyzeApk`, `checkLink`,
`getReport`) — that's the only file that needs to change if the API
contract changes.

## Project structure

```
src/
  api.js                  All backend calls
  App.jsx                 View routing + API orchestration
  data/demoReport.js       Mock reports (red/yellow/green + link) for demo mode
  i18n/                    Translations (en/hi/pa) + LanguageContext
  components/              Reusable UI pieces (uploader, gauge, tables, etc.)
  pages/                   Home, Result, LinkCheck, InfoPage
```

## Notes

- Nothing in this frontend executes or installs the uploaded APK — it only
  ever sends the file to the backend for static parsing, matching the
  project's non-negotiable safety rules.
- The permission table, gauge and verdict banner all key off a single
  `report` shape (see `src/data/demoReport.js` for the exact fields) —
  point the real API response at the same shape and every screen works
  unchanged.
- Every result screen renders the "Static analysis only. This is not a
  guarantee of safety." disclaimer; don't remove it.
