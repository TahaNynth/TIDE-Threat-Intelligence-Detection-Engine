<div align="center">

# 🌊 TIDE
### Threat Intelligence Detection Engine

**An automated pipeline that converts raw threat intelligence reports into deployable detection content in seconds.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

*Built as a Cyber Threat Intelligence semester project — Air University Islamabad*

</div>

---

## What Is TIDE?

Security analysts spend hours reading threat reports, manually hunting for indicators, mapping adversary behavior to frameworks, and hand-crafting detection rules. TIDE automates that entire workflow.

Paste or upload any threat intelligence report — a blog post, a PDF advisory, an incident writeup — and TIDE instantly produces:

- Every **IP address, domain, URL, email address, and file hash** buried in the text
- The **MITRE ATT&CK techniques** the adversary is using, with confidence scoring
- Ready-to-deploy **Sigma, YARA, and Snort detection rules** built from the extracted indicators
- An **analyst-grade risk assessment** (Low → Critical) with scored rationale
- A structured **executive summary** with targeted recommendations

The entire engine runs **100% offline** — no API keys, no internet connection required. An optional LLM integration (OpenAI or Google Gemini) can enhance the written summary, but every piece of detection content is generated deterministically.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How the Engines Work](#how-the-engines-work)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Using TIDE](#using-tide)
- [API Reference](#api-reference)
- [LLM Integration](#llm-integration)
- [Academic Context](#academic-context)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          TIDE Frontend                          │
│             React 18 · TypeScript · Tailwind CSS                │
│                                                                 │
│  Dashboard  │  Threat Analysis  │  IOC Explorer  │  ATT&CK     │
│  Reports    │  Detection Rules  │  Settings                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST API (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          TIDE Backend                           │
│                    Flask 3 · Python 3.10+                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ IOC Extractor│  │ MITRE Mapper │  │   Rule Generator      │ │
│  │  (Regex)     │  │  (Keywords)  │  │  Sigma / YARA / Snort │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Risk Scorer  │  │  Summary     │  │  File Parser          │ │
│  │  (Weighted)  │  │  Generator   │  │  PDF / DOCX / TXT     │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           SQLite Database (Persistent History)            │  │
│  │   analyses · iocs · techniques · detection_rules          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │  Optional
                           ▼
              ┌────────────────────────┐
              │   LLM API (Optional)   │
              │  OpenAI  ·  Gemini     │
              │  (summary enhancement) │
              └────────────────────────┘
```

---

## Features

### Core Pipeline

| Feature | Description |
|---|---|
| **IOC Extraction** | Regex engine extracts IPv4, IPv6, domains, URLs, emails, MD5, SHA1, SHA256 |
| **MITRE ATT&CK Mapping** | Local 42-technique knowledge base with weighted keyword matching |
| **Sigma Rules** | YAML detection rules targeting SIEM platforms (Splunk, Sentinel, Elastic) |
| **YARA Rules** | Binary pattern matching rules for malware scanning and EDR |
| **Snort Rules** | Network IDS signatures for Snort 3 / Suricata |
| **Risk Scoring** | Composite 0–100 scoring engine with Low / Medium / High / Critical output |
| **Analyst Summary** | Deterministic executive summary with threat actor, targets, and recommendations |
| **File Parsing** | Upload and parse PDF, TXT, and DOCX reports up to 16 MB |

### Platform Capabilities

| Feature | Description |
|---|---|
| **Analysis History** | All analyses persisted in SQLite; full browsing and re-viewing |
| **IOC Explorer** | Searchable, filterable, paginated database of all extracted indicators |
| **Export** | CSV (IOCs), JSON (full analysis), individual rule file downloads |
| **LLM Enhancement** | Optional OpenAI / Gemini integration for AI-written executive summaries |
| **Dark Mode UI** | Professional SOC-style dashboard; fully responsive |
| **Offline First** | Every feature works with zero API keys or internet access |

---

## Tech Stack

### Frontend

| Library | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Tailwind CSS 3 | Utility-first styling |
| React Router 6 | Client-side routing |
| Recharts | Dashboard visualizations (pie, bar, radial) |
| Lucide React | Icon set |
| React Syntax Highlighter | Sigma / YARA / Snort code display |
| React Hot Toast | Notifications |
| Axios | HTTP client with interceptors |
| Vite | Build tool and dev server |

### Backend

| Library | Purpose |
|---|---|
| Flask 3 | REST API framework |
| Flask-CORS | Cross-origin request handling |
| SQLite (stdlib) | Persistent storage — zero config |
| pdfplumber | PDF text extraction |
| python-docx | DOCX parsing |
| python-dotenv | Environment variable management |
| openai (optional) | GPT summary enhancement |
| google-generativeai (optional) | Gemini summary enhancement |

---

## Project Structure

```
tide/
│
├── backend/
│   ├── app.py                    # Flask application factory and entry point
│   ├── config.py                 # Configuration from environment variables
│   ├── requirements.txt          # Python dependencies
│   │
│   ├── models/
│   │   └── database.py           # SQLite schema, connection management, seeding
│   │
│   ├── routes/
│   │   ├── analysis.py           # POST /analyze, POST /upload, GET /analyses
│   │   ├── ioc.py                # GET /iocs — queryable IOC database
│   │   ├── mitre.py              # GET /techniques, GET /tactics
│   │   ├── detection.py          # GET /rules
│   │   ├── reports.py            # GET /reports, export endpoints
│   │   └── settings.py           # GET/PUT /settings, POST /settings/test-llm
│   │
│   ├── services/
│   │   ├── ioc_extractor.py      # Regex-based IOC extraction engine
│   │   ├── mitre_mapper.py       # Keyword → ATT&CK technique mapping
│   │   ├── rule_generator.py     # Sigma, YARA, Snort template generation
│   │   ├── summary_generator.py  # Deterministic analyst summary engine
│   │   ├── risk_scorer.py        # Weighted composite risk scoring
│   │   └── llm_service.py        # Optional OpenAI / Gemini integration
│   │
│   ├── utils/
│   │   ├── file_parser.py        # PDF, DOCX, TXT text extraction
│   │   └── validators.py         # Input sanitization and validation
│   │
│   └── data/
│       └── mitre_mappings.json   # Local ATT&CK knowledge base (42 techniques)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx               # Router setup
│       ├── main.tsx              # React entry point
│       ├── index.css             # Tailwind + custom CSS
│       │
│       ├── types/
│       │   └── index.ts          # All TypeScript interfaces
│       │
│       ├── services/
│       │   └── api.ts            # Axios API client
│       │
│       ├── hooks/
│       │   └── useAnalysis.ts    # Analysis state management
│       │
│       ├── components/
│       │   ├── layout/           # Sidebar, TopNav, Layout wrapper
│       │   ├── ui/               # RiskBadge, ConfidenceBadge, CopyButton, StatCard
│       │   ├── dashboard/        # Charts and RecentAnalyses table
│       │   └── analysis/         # ReportInput, AnalysisResults (tabbed)
│       │
│       └── pages/
│           ├── Dashboard.tsx     # Overview stats and charts
│           ├── ThreatAnalysis.tsx# Main analysis workflow
│           ├── IOCExplorer.tsx   # Searchable IOC database
│           ├── MitreMapping.tsx  # ATT&CK technique browser
│           ├── DetectionRules.tsx# Rule viewer with syntax highlighting
│           ├── Reports.tsx       # Full analysis history
│           └── Settings.tsx      # LLM and platform configuration
│
├── sample_threat_report.txt      # LockBit 3.0 sample report for testing
├── .env.example                  # Environment variable template
└── README.md
```

---

## How the Engines Work

### 1. IOC Extraction Engine

The extractor uses a priority-ordered regex pipeline to avoid double-counting:

```
SHA256 (64 hex chars) → SHA1 (40) → MD5 (32)
→ URLs → Emails → IPv4 / IPv6 → Standalone Domains
```

Each extracted value is deduplicated (case-insensitive), and domains are validated against a TLD whitelist to suppress false positives. Private IP ranges are flagged but still included, since internal infrastructure is relevant in lateral movement reporting.

### 2. MITRE ATT&CK Mapping Engine

The local knowledge base (`data/mitre_mappings.json`) contains 42 techniques across all 12 ATT&CK tactics. Each technique has a list of weighted keywords:

```json
{
  "id": "T1003",
  "name": "OS Credential Dumping",
  "keywords": [
    { "word": "mimikatz",          "weight": 3 },
    { "word": "credential dumping","weight": 3 },
    { "word": "lsass",             "weight": 3 },
    { "word": "hashdump",          "weight": 3 },
    { "word": "pass-the-hash",     "weight": 3 },
    { "word": "sekurlsa",          "weight": 3 }
  ]
}
```

The mapper scans the full report text, accumulates weighted scores per technique, then assigns confidence:

| Weighted Score | Confidence |
|---|---|
| ≥ 5 | High |
| ≥ 3 | Medium |
| ≥ 1 | Low |

Results are sorted High → Medium → Low, capped at 20 techniques, and stored per analysis.

### 3. Detection Rule Generator

Rules are generated from templates parameterized with the extracted IOC and technique data:

**Sigma** — generates one rule for network IOCs (IP/domain `detection:` blocks), one for file hashes, and up to three technique-specific behavioral rules. Output is valid YAML with proper `logsource`, `detection`, and `tags` blocks.

**YARA** — generates a file hash rule, a network indicators rule (domain/IP/URL strings), and behavioral rules for high-confidence techniques (PowerShell obfuscation, credential dumping, ransomware indicators).

**Snort** — generates `alert ip` rules for each extracted IP (bidirectional — inbound C2 callback and outbound traffic), `alert dns` and `alert http` rules for domains, and `alert http` rules for URL paths. All are grouped into a single deployable `.rules` file.

### 4. Risk Scoring Engine

The risk score is a composite of six factor groups (max 100):

| Factor | Max Points |
|---|---|
| IOC volume (5 → 30 IOCs = 10 → 20 pts) | 20 |
| Technique volume (3 → 10+ techniques) | 20 |
| Ransomware techniques present (T1486, T1489, T1490) | 20 |
| Credential theft techniques (T1003, T1110, T1555) | 15 |
| Lateral movement techniques (T1021.x, T1570) | 10 |
| Privilege escalation techniques (T1055, T1068, T1134) | 8 |
| Destructive / phishing keyword boosts | +5–10 each |

| Final Score | Level |
|---|---|
| 75–100 | Critical |
| 50–74 | High |
| 25–49 | Medium |
| 0–24 | Low |

### 5. Analyst Summary Engine

The summary generator uses the extracted data (not the raw text) to produce structured output deterministically:

1. **Threat actor** is identified by scanning for known group names (APT28, LockBit, Lazarus, etc.)
2. **Targeted sectors** are identified by sector-keyword matching (banking, healthcare, government, etc.)
3. **Attack type** is classified (ransomware, APT, supply chain, phishing campaign, etc.)
4. **Executive summary** is constructed as two paragraphs using the above facts
5. **Recommendations** are technique-specific — each identified ATT&CK technique maps to one or more concrete mitigations

---

## Installation

### Prerequisites

| Requirement | Minimum Version | Install |
|---|---|---|
| Python | 3.10 | [python.org](https://www.python.org/downloads/) |
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org/) |
| npm | 8 | Included with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com/) |

---

### Windows

```powershell
# 1. Clone the repository
git clone https://github.com/TahaNynth/TIDE.git
cd TIDE

# 2. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 3. Frontend setup (separate terminal)
cd ..\frontend
npm install
```

### macOS / Linux

```bash
# 1. Clone the repository
git clone https://github.com/TahaNynth/TIDE.git
cd TIDE

# 2. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Frontend setup (separate terminal)
cd ../frontend
npm install
```

---

## Configuration

Copy the environment template and edit as needed:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### `.env` options

```env
# LLM Enhancement (optional — leave blank for offline mode)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Which provider to use: none | openai | gemini
LLM_PROVIDER=none

# OpenAI model (only used when LLM_PROVIDER=openai)
LLM_MODEL=gpt-4o-mini

# SQLite database file location (relative to backend/)
DATABASE_PATH=database.db

# Flask settings
FLASK_ENV=development
SECRET_KEY=change-this-in-production
```

> **Note:** The platform is fully functional with all values left at their defaults. LLM settings only affect the quality of the written executive summary — all IOCs, ATT&CK mappings, detection rules, and risk scores are generated without any API call.

---

## Running the Application

### Terminal 1 — Backend

```powershell
cd backend

# Activate virtual environment
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

python app.py
```

Expected output:
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

### Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

The **API Online** indicator in the top navigation bar confirms the frontend has connected to the backend successfully.

---

## Using TIDE

### Running Your First Analysis

1. Navigate to **Threat Analysis** in the left sidebar
2. Paste any threat intelligence text into the editor, or upload a PDF / DOCX / TXT file
3. Optionally add a report title
4. Click **Run Analysis**
5. Results appear across four tabs: **Summary**, **IOCs**, **ATT&CK**, **Detection Rules**

A sample LockBit 3.0 report is included at `sample_threat_report.txt` for immediate testing.

### Exploring Results

| Tab | What you find |
|---|---|
| **Summary** | Risk gauge, executive summary, threat actor, targeted sectors, recommendations |
| **IOCs** | Categorized indicators table; filter by network/file; copy or export CSV |
| **ATT&CK** | Technique cards with confidence, tactic, matched keywords, MITRE links |
| **Detection Rules** | Sigma / YARA / Snort with syntax highlighting, copy, and download per rule |

### IOC Explorer

The **IOC Explorer** page aggregates all indicators across every analysis into a single searchable database. Filter by type (IPv4, Domain, SHA256, etc.) or category (network/file). Export the current view to CSV.

### Detection Rules Library

The **Detection Rules** page provides a split-panel view of all generated rules across all analyses. Select any rule from the left panel to view its full content with syntax highlighting. Download individual files or all rules of a given type at once.

### Reports History

The **Reports** page lists every analysis ever run, with risk level, IOC count, technique count, and export options. Click any row title to reopen the full analysis result.

---

## API Reference

All endpoints are prefixed with `/api`.

### Analysis

| Method | Endpoint | Body / Params | Description |
|---|---|---|---|
| `POST` | `/analyze` | `{ text, title? }` | Run full analysis on report text |
| `POST` | `/upload` | `multipart/form-data` (file) | Parse uploaded file, returns extracted text |
| `GET` | `/analyses` | — | List all past analyses |
| `GET` | `/analyses/:id` | — | Full analysis result by ID |
| `DELETE` | `/analyses/:id` | — | Delete an analysis and all related data |
| `GET` | `/stats` | — | Aggregate dashboard statistics |

### IOCs

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/iocs` | `analysis_id`, `type`, `category`, `search`, `limit`, `offset` | Paginated IOC query |
| `GET` | `/iocs/types` | — | Count of IOCs by type |

### ATT&CK Techniques

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/techniques` | `analysis_id`, `tactic`, `confidence`, `search` | Query technique database |
| `GET` | `/tactics` | — | Tactic names with technique counts |

### Detection Rules

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/rules` | `analysis_id`, `rule_type` | Query rules (`sigma`, `yara`, `snort`) |

### Export

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports/:id/export/iocs` | Download IOCs as CSV |
| `GET` | `/reports/:id/export/json` | Download full analysis as JSON |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings` | Retrieve current settings (API keys masked) |
| `PUT` | `/settings` | Update settings |
| `POST` | `/settings/test-llm` | Test the configured LLM connection |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", version: "1.0.0" }` |

### Example: Analyze a Report

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Attackers used mimikatz to dump LSASS credentials and deployed LockBit ransomware after vssadmin delete shadows. C2 at 185.220.101.47.",
    "title": "Quick Test"
  }'
```

Response (abbreviated):

```json
{
  "analysis_id": "a1b2c3d4-...",
  "risk": { "level": "Critical", "score": 89 },
  "ioc_stats": { "total": 2, "network_total": 1, "file_total": 0 },
  "techniques": [
    { "technique_id": "T1003", "technique_name": "OS Credential Dumping", "confidence": "High" },
    { "technique_id": "T1486", "technique_name": "Data Encrypted for Impact", "confidence": "High" },
    { "technique_id": "T1490", "technique_name": "Inhibit System Recovery", "confidence": "High" }
  ],
  "rules": {
    "sigma": [ { "name": "...", "content": "title: ..." } ],
    "yara":  [ { "name": "...", "content": "rule ..." } ],
    "snort": [ { "name": "...", "content": "alert ip ..." } ]
  }
}
```

---

## LLM Integration

TIDE works completely without an LLM. If you want AI-enhanced executive summaries:

1. Go to **Settings** in the sidebar
2. Select **OpenAI** or **Google Gemini**
3. Paste your API key
4. Click **Test Connection**
5. Click **Save Settings**

From that point, every new analysis will send the deterministic summary to the LLM for rewriting into more fluent prose. All detection content (IOCs, rules, ATT&CK, risk score) is never sent to any external service.

**Supported models:**

| Provider | Models |
|---|---|
| OpenAI | `gpt-4o-mini` (default), `gpt-4o`, `gpt-4-turbo` |
| Google Gemini | `gemini-1.5-flash` (auto-selected) |

---

## Academic Context

**Course:** Cyber Threat Intelligence  
**Institution:** Air University, Islamabad  
**Semester:** 6

TIDE demonstrates practical application of:

- **IOC normalization** — structured extraction following STIX/TAXII indicator categories
- **MITRE ATT&CK** — technique identification and confidence-based mapping
- **Detection engineering** — Sigma, YARA, and Snort rule authoring from threat data
- **Risk-based prioritization** — quantified scoring for triage and response decisions
- **Analyst workflow automation** — end-to-end pipeline from raw report to deployable artifact

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with Flask · React · SQLite<br/>
<i>Threat Intelligence Detection Engine</i>
</div>
