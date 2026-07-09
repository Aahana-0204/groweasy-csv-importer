# GrowEasy CSV Importer

> AI-powered CSV importer that intelligently maps any CSV format into GrowEasy CRM fields using Google Gemini 1.5 Flash.

## Live Demo

| | Link |
|---|---|
| **Live App** | https://frontend-omega-nine-qvzgnc29gh.vercel.app |
| **GitHub** | https://github.com/Aahana-0204/groweasy-csv-importer |

## Features

- Upload any CSV regardless of column names (Facebook Ads, Google Ads, Excel, Real Estate CRM, etc.)
- Drag & drop or file picker upload
- CSV preview with sticky headers, horizontal & vertical scrolling
- Virtualized table for smooth performance with large files
- AI field mapping via Google Gemini 1.5 Flash
- Rule-based fallback mapping if AI is unavailable
- Batch processing (20 rows/batch, 4 parallel) with retry logic
- Skips rows with neither email nor mobile
- Results table — Imported tab + Skipped tab
- Export results as CRM-ready CSV
- Real-time progress indicator during processing
- API status badge in header
- Dark mode support
- Full TypeScript throughout

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| API | Next.js Route Handlers (serverless) |
| AI | Google Gemini 1.5 Flash |
| Deployment | Vercel (frontend + API) |

## Architecture

Everything runs on Vercel — no separate backend server needed.

```
Browser
  └── Vercel (Next.js)
        ├── / (React frontend)
        ├── /api/import (CSV processing + Gemini AI)
        └── /api/health (status check)
```

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
| `crm_status` | GOOD_LEAD_FOLLOW_UP / DID_NOT_CONNECT / BAD_LEAD / SALE_DONE |
| `crm_note` | Remarks, extra emails, extra phones, follow-up notes |
| `data_source` | leads_on_demand / meridian_tower / eden_park / varah_swamy / sarjapur_plots |
| `possession_time` | Property possession timing |
| `description` | Additional description |

## Local Setup

### 1. Clone

```bash
git clone https://github.com/Aahana-0204/groweasy-csv-importer.git
cd groweasy-csv-importer/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Get a free Gemini API key

Go to https://aistudio.google.com — click **Get API Key** — free, instant.

### 4. Create environment file

```bash
# frontend/.env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

> The app works without a Gemini key too — it falls back to smart rule-based column mapping automatically.

## Project Structure

```
groweasy-csv-importer/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  # Main 4-step UI
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   └── api/
│   │   │       ├── import/route.ts       # POST /api/import (AI + CSV processing)
│   │   │       └── health/route.ts       # GET /api/health
│   │   ├── components/
│   │   │   ├── DropZone.tsx              # Drag & drop upload
│   │   │   ├── CSVPreviewTable.tsx       # Virtualized preview table
│   │   │   ├── ResultsTable.tsx          # Import results
│   │   │   ├── ProgressBar.tsx           # AI processing indicator
│   │   │   ├── StepIndicator.tsx         # Step 1-4 progress
│   │   │   └── ThemeToggle.tsx           # Dark mode toggle
│   │   ├── hooks/
│   │   │   └── useCSVImport.ts           # All state + API logic
│   │   └── types/
│   │       └── crm.ts                    # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── backend/                              # Express backend (reference only)
├── sample-leads.csv                      # Sample CSV for testing
├── render.yaml
└── README.md
```

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to https://vercel.com and import the repository
3. Set **Root Directory** to `frontend`
4. Add environment variable: `GEMINI_API_KEY` = your Gemini API key
5. Deploy

That is all — no separate backend needed.

## Sample CSV

A `sample-leads.csv` is included in the repo root for testing. It has 20 rows with intentionally varied column names and edge cases to demonstrate AI field mapping.

## Notes

- `.env` files are git-ignored — never commit real API keys
- Without `GEMINI_API_KEY`, the app uses rule-based mapping (still useful)
- Rows missing both email and mobile are automatically skipped
- Files over 500 rows are capped with a warning banner
