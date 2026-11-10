# InfluenceAI – Automated Micro-Influencer Outreach System

> **EDXSO AI Engineer Intern – Assignment 1**  
> Complete Product Implementation Blueprint & Production-Grade Full-Stack Application  
> Built with React + Vite + Tailwind CSS, FastAPI, SQLite / PostgreSQL (Supabase), and Gemini LLM.

---

## 1. Project Overview & Pitch

**One-line pitch:** Discover relevant micro-influencers, qualify and enrich their public profiles, generate personalized collaboration messages, and track outreach from one unified dashboard.

InfluenceAI automates the laborious multi-step workflow of creator marketing:
1. **Define Campaign:** Setup target niche, platform, follower range (e.g. 5,000–100,000 subs), and minimum engagement rate threshold.
2. **Discover Public Profiles:** Query YouTube Data API v3 or leverage a curated authentic dataset of 50+ verified creators with canonical channel URLs, subscriber counts, and average views.
3. **Deterministic Qualification:** Transparent rule-based classification into **Pass**, **Fail**, or **Review** with visible, persisted explanations.
4. **Enrichment & Business Contact Inspection:** Search public bios/descriptions for verified business emails without guessing or synthesizing false emails.
5. **AI Message Generation:** LLM personalization engine powered by Gemini 1.5 producing structured email drafts (**strictly 60–90 words**) and Instagram DMs (**strictly 15–30 words**) referencing ground-truth facts.
6. **Demo-Safe Outreach Simulation & Tracker:** Full lifecycle auditing (`Draft` → `Approved` → `Simulated Sent` → `Replied` / `Interested`), duplicate detection, and RFC 4180 CSV export.

---

## 📸 Application Screenshots & UI Previews

### 1. Intelligence Dashboard & 10-Step Interactive Evaluation Tour
![Dashboard Preview](screenshots/dashboard_preview.svg)

### 2. AI Outreach Studio (Live Word Counters, Gmail Inbox & Mobile Instagram Mockups)
![Outreach Studio Preview](screenshots/outreach_studio_preview.svg)

---

## 2. Architecture & Workflow

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React + Vite + Tailwind)"]
        UI_Dash["Dashboard (KPIs & Funnel Charts)"]
        UI_Camp["Campaign Management"]
        UI_Disc["Public Creator Discovery"]
        UI_Inf["Influencer Roster & Evidence Inspector"]
        UI_Studio["AI Outreach Studio (Live Word Counters)"]
        UI_Track["Outreach Tracker (Simulated vs Real)"]
        UI_Set["Settings & CSV Export"]
    end

    subgraph Backend ["Backend (FastAPI REST API)"]
        Router_Camp["/api/campaigns"]
        Router_Inf["/api/influencers & /api/campaign-influencers"]
        Router_Out["/api/outreach"]
        Router_An["/api/analytics"]
        
        Serv_Disc["Discovery Service (YouTube API v3)"]
        Serv_Qual["Qualification Engine (Deterministic Rules)"]
        Serv_Enrich["Enrichment Service (Email & Engagement)"]
        Serv_Gen["Personalization Service (Gemini JSON Contract)"]
        Serv_Out["Simulation & CSV Export Service"]
    end

    subgraph Storage ["Database Layer"]
        DB[("PostgreSQL / Supabase / SQLite")]
        T_Camp["campaigns"]
        T_Inf["influencers"]
        T_CI["campaign_influencers (Unique Constraint)"]
        T_Msg["outreach_messages"]
        T_Evt["outreach_events"]
    end

    Frontend -->|REST / JSON| Backend
    Backend --> Storage
    Serv_Disc -.->|Read-Only Public Metadata| YT["YouTube Data API v3"]
    Serv_Gen -.->|Structured Prompt| Gemini["Gemini 1.5 Flash"]
```

---

## 3. Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router DOM v7, Axios, Lucide React, Recharts.
- **Backend:** Python 3.12, FastAPI, Pydantic v2 Settings, SQLAlchemy 2.0, HTTPX, SQLite / psycopg PostgreSQL, google-api-python-client.
- **AI & Personalization:** Gemini API (`gemini-1.5-flash`) with structured JSON schema output and deterministic fallback generator.
- **Testing:** Pytest with end-to-end API integration and rule boundary verification.

---

## 4. Exact Project Structure

```
InfluenceAI/
├── frontend/
│   ├── src/
│   │   ├── components/         # StatCard, QualificationBadge, Tooltip, Modal, Skeleton, Navbar, Sidebar
│   │   ├── pages/              # Dashboard, Campaigns, Discovery, Influencers, OutreachStudio, OutreachTracker, Settings
│   │   ├── layouts/            # MainLayout
│   │   ├── services/           # api.js Axios client
│   │   ├── hooks/              # useCampaigns.jsx Context & Hook
│   │   ├── utils/              # formatters.js (number, word count, date)
│   │   ├── App.jsx             # React Router routing
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind CSS imports
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
├── backend/
│   ├── app/
│   │   ├── api/routes/         # campaigns.py, influencers.py, outreach.py, analytics.py
│   │   ├── services/           # discovery_service.py, qualification_service.py, enrichment_service.py, personalization_service.py, outreach_service.py
│   │   ├── models/             # campaign.py, influencer.py, outreach.py (SQLAlchemy)
│   │   ├── schemas/            # campaign.py, influencer.py, outreach.py (Pydantic v2)
│   │   ├── database/           # session.py (SQLite/PostgreSQL engine)
│   │   ├── core/               # config.py (Pydantic settings)
│   │   └── main.py             # FastAPI entrypoint, CORS, lifespan
│   ├── tests/                  # test_influenceai.py unit & integration tests
│   ├── seed_demo.py            # Initial DB seeder with 50+ real verified creator channels
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── database/
│   └── schema.sql              # Supabase/PostgreSQL schema with indexes & constraints
├── data/
│   └── exports/
│       └── sample_verified_creators.csv  # Verified sample research export
├── docs/
│   └── InfluenceAI_Complete_Build_Guide.pdf
├── .gitignore
├── .env.example
└── README.md
```

---

## 5. Environment Variables Reference

### Backend (`backend/.env`):
```env
# Optional: Live YouTube Data API v3 key (leaves blank to use authentic verified dataset)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Optional: Gemini API key for dynamic LLM drafting (falls back to deterministic compliant generator if unset)
GEMINI_API_KEY=your_gemini_api_key_here

# Database URL: SQLite by default for instant local setup, or Supabase PostgreSQL
DATABASE_URL=sqlite:///./influenceai.db
# DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# Supabase credentials (optional)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

APP_ENV=development
OUTREACH_MODE=simulation
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

> **Security Note:** Secrets are strictly kept on the backend. The frontend bundle never receives API keys or service role tokens.

---

## 6. Local Setup & Quickstart

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.11+)

### 1. Backend Setup
```bash
# From repository root
cd backend

# Create and activate virtual environment
python -m venv ../.venv
# On Windows PowerShell:
..\.venv\Scripts\Activate.ps1
# On macOS / Linux:
# source ../.venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database seeder (initializes DB with 50+ authentic public creators)
python seed_demo.py

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend Setup
```bash
# Open a new terminal in repository root
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 7. Key Features & Deterministic Business Rules

### A. Qualification Engine
Unlike arbitrary heuristics, InfluenceAI implements transparent deterministic qualification:
```python
if followers is None:
    status = 'Review'
    reasons.append("Follower count is unknown or unlisted (requires manual review).")
elif followers < min_followers:
    status = 'Fail'
    reasons.append(f"Follower count ({followers:,}) is below campaign minimum ({min_followers:,}).")
elif followers > max_followers:
    status = 'Fail'
    reasons.append(f"Follower count ({followers:,}) exceeds campaign maximum ({max_followers:,}).")
elif engagement_rate is None:
    status = 'Review'
    reasons.append("Engagement rate cannot be computed reliably (insufficient video/interaction metrics).")
elif engagement_rate >= campaign.min_engagement:
    status = 'Pass'
    reasons.append(f"Engagement rate ({engagement_rate:.2f}%) meets/exceeds campaign threshold ({campaign.min_engagement:.2f}%).")
else:
    status = 'Fail'
    reasons.append(f"Engagement rate ({engagement_rate:.2f}%) is below campaign threshold ({campaign.min_engagement:.2f}%).")
```

### B. Engagement Metric Calculation
Computed per video rate, then averaged across recent eligible videos:
$$\text{Engagement Rate} = \frac{\text{Likes} + \text{Comments}}{\text{Views}} \times 100$$
- Sample window: 10 recent videos.
- Missing / 0-view videos are strictly excluded from calculation.

### C. AI Personalization Contract
Gemini output is constrained to a structured JSON schema:
- **Email Subject:** Under 60 characters.
- **Email Body:** Strictly between **60 and 90 words**.
- **Instagram DM:** Strictly between **15 and 30 words**.
- **Personalization Facts:** List of verified facts extracted from channel metadata.
- **Anti-Hallucination Policy:** Never invents contact details, demographic statistics, or past relationships.

### D. Safe Simulated Sending
Outreach records create an event with `simulated = True` and status `Simulated Sent`. No unauthorized network transmission is made, protecting brand reputation while demonstrating full end-to-end traceability.

---

## 8. Suggested 10-Step Demonstration Sequence

1. **Open Dashboard (`/`):** Inspect global statistics, qualification breakdown charts, and outreach event status.
2. **Review Campaigns (`/campaigns`):** See pre-configured Fitness and Tech campaigns with their respective follower and engagement benchmarks.
3. **Create Campaign Modal:** Click **New Campaign** to configure custom thresholds (e.g. 5,000–50,000 followers, 2.5% engagement).
4. **Discover Creators (`/discovery`):** Search for a keyword or niche (e.g., "Calisthenics" or "Python"), view live channel metrics, and import to campaign with duplicate prevention.
5. **Inspect Influencer Evidence (`/influencers`):** Open a creator profile to review the transparent qualification audit and inspect the channel URL and retrieval timestamp.
6. **Re-qualify Campaign:** Adjust criteria or click **Re-qualify Campaign** to verify deterministic state changes.
7. **Open Outreach Studio (`/outreach-studio`):** Inspect the live word counters (Email: 60–90 words, DM: 15–30 words) and ground-truth verified facts.
8. **Edit & Regenerate:** Make edits to the subject or body and save revisions.
9. **Simulate Send:** Click **Simulate Send Email** to create a demo-safe outreach record with `simulated=true`.
10. **Track & Export (`/tracker` & `/settings`):** Inspect event history, update status to *Replied* or *Interested*, and click **Export Campaign Tracker (CSV)** to download the audit dataset.

---

## 9. Automated Test Verification

Run the test suite with:
```bash
.venv\Scripts\pytest backend/tests/test_influenceai.py -v
```

All 5 test suites verify:
- Follower and engagement boundary conditions (including exact min/max).
- Zero-view filtering in engagement calculations.
- Honest public email extraction (ignoring false positives).
- Strict email (60–90 words) and DM (15–30 words) word count compliance.
- End-to-end API lifecycle: campaign creation, duplicate-safe discovery, AI generation, simulated sending, and CSV export.

---

## 10. License & Submission Info

- **Repository:** `influenceai-automated-outreach`
- **Candidate:** EDXSO AI Engineer Intern Candidate
- **Version:** 1.0.0 (Production Blueprint Implementation)

