# GrowEasy CSV Importer

> AI-powered CSV importer that intelligently maps any CSV format into GrowEasy CRM fields using Google Gemini.

## 🚀 Live Demo

| | Link |
|---|---|
| **Frontend (Vercel)** | https://frontend-omega-nine-qvzgnc29gh.vercel.app |
| **Backend API (Render)** | https://groweasy-backend-fgq2.onrender.com |
| **GitHub Repository** | https://github.com/Aahana-0204/groweasy-csv-importer |

> **Note:** Backend is on Render free tier — first request may take ~1-2 min to wake up (cold start). Subsequent requests are fast.

## Features

- Upload any CSV (Facebook Ads, Google Ads, Excel, Real Estate CRM, etc.)
- Drag & drop or file picker upload
- CSV preview with sticky headers, horizontal & vertical scrolling
- Virtualized table for large files (handles 10,000+ rows smoothly)
- AI field mapping via Google Gemini 1.5 Flash — works with any column names
- Batch processing (10 rows/batch) with retry mechanism (3 retries + backoff)
- Skips records with neither email nor mobile
- Results table with Imported / Skipped tabs
- Export results as CRM-ready CSV
- Progress indicator during AI processing
- Dark mode support
- Full TypeScript throughout

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| AI | Google Gemini 1.5 Flash |
| Deployment | Vercel (frontend) + Render (backend) |

## CRM Fields

| Field | Description |
|---|---|
| `created_at` | Lead creation timestamp |
| `name` | Full name |
| `email` | Primary email |
| `country_code` | Dialing code e.g. +91 |
| `mobile_without_country_code` | Digits only |
| `company` | Company name |
| `city` | City |
| `state` | State / Province |
| `country` | Country |
| `lead_owner` | Assigned sales person |
| `crm_status` | One of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE |
| `crm_note` | Remarks, extra emails, extra phones, follow-up notes |
| `data_source` | One of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots |
| `possession_time` | Property possession timing |
| `description` | Additional description |

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/Aahana-0204/groweasy-csv-importer.git
cd groweasy-csv-importer
```

### 2. Get a free Gemini API key

Go to https://aistudio.google.com — click "Get API Key" — it is free.

### 3. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 4. Configure frontend environment

```bash
cd frontend
cp .env.example .env.local
```

`frontend/.env.local` is already set to:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 5. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 6. Run locally

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

Open http://localhost:3000 in your browser.

## Backend API

### Health Check
```
GET /health
```

### Import CSV
```
POST /api/import
Content-Type: multipart/form-data
Field: file (CSV file, max 10MB)
```

**Response:**
```json
{
  "success": true,
  "total_rows": 25,
  "imported": 21,
  "skipped": 4,
  "records": [...],
  "skipped_records": [
    { "row": 3, "reason": "No email or mobile found", "data": {} }
  ]
}
```

## Deployment

### Frontend on Vercel (free)

1. Push repo to GitHub
2. Go to https://vercel.com and import the repo
3. Set Root Directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com`
5. Deploy

### Backend on Render (free)

1. Go to https://render.com and create a new Web Service
2. Connect your GitHub repo
3. Set Root Directory to `backend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variables:
   - `GEMINI_API_KEY` = your Gemini API key
   - `FRONTEND_URL` = your Vercel frontend URL
   - `NODE_ENV` = production
7. Deploy

## Project Structure

```
groweasy-csv-importer/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   ├── routes/import.ts      # POST /api/import route
│   │   ├── services/
│   │   │   ├── aiExtractor.ts    # Gemini AI field mapping
│   │   │   ├── batchProcessor.ts # Batch + retry logic
│   │   │   └── csvParser.ts      # CSV parsing
│   │   └── types/crm.ts          # TypeScript types
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/page.tsx          # Main page (4-step flow)
│   │   ├── components/
│   │   │   ├── DropZone.tsx      # Drag & drop upload
│   │   │   ├── CSVPreviewTable.tsx  # Virtualized preview
│   │   │   ├── ResultsTable.tsx  # Import results
│   │   │   ├── ProgressBar.tsx   # AI processing indicator
│   │   │   ├── StepIndicator.tsx # Step 1-4 progress
│   │   │   └── ThemeToggle.tsx   # Dark mode toggle
│   │   ├── hooks/useCSVImport.ts # All import state logic
│   │   └── types/crm.ts          # TypeScript types
│   └── package.json
├── render.yaml                   # Render deployment config
└── README.md
```

## Notes

- `.env` files are git-ignored — never commit real API keys
- Backend normalizes AI output defensively to handle malformed responses
- Frontend simulates progress while backend processes batches
- Rows with neither email nor mobile are automatically skipped
