<div align="center">

# ▫ D A T A D E C K ▫

### *Ingest. Cleanse. Forecast. Compose.*

**A transparent data-pipeline studio — every transformation visible, reversible, and yours.**

`FastAPI` · `React` · `PostgreSQL` · `pandas` · `scikit-learn` · `Prophet` · `Plotly`

◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎

</div>

---

## ❖ What is DataDeck?

DataDeck takes raw, messy data from **anywhere** — PostgreSQL, MySQL, CSV, JSON, XLSX — and walks it through a four-stage deck of cards:

| Card | Stage | What happens |
|:---:|---|---|
| ① | **Ingest** | Connect to a database or drop a file. Schema and types are inferred automatically. |
| ② | **Cleanse** | Detect outliers with the method *you* choose. Decide per column what happens to them. Preview before applying. |
| ③ | **Forecast** | ML models predict the data flow — next values, trends, anomalies — with confidence bands and honest error metrics. |
| ④ | **Compose** | Build custom visuals and dashboards from a single portable chart spec. Export anywhere. |

Every step is written to a **lineage log**. Nothing is silent. Nothing is irreversible.

---

## ❖ The Idea in One Sentence

> Most tools clean your data and hide what they did. **DataDeck shows its work.**

---

## ❖ Feature Constellation

### ◈ Ingestion
- PostgreSQL and MySQL via SQLAlchemy (read-only connections by default)
- CSV, JSON, XLSX with chunked reading for large files
- Automatic type inference, datetime detection, and schema preview
- Encrypted credential vault

### ◈ Cleansing
- Outlier detectors: **IQR**, **Z-score**, **Modified Z-score (MAD)**, **Isolation Forest**, **Custom rule**
- Per-column actions: **cap/winsorize**, **drop**, **impute** (mean · median · interpolate), **flag only**
- Dry-run preview showing exactly which rows change
- Missing-value handling and duplicate detection

### ◈ Forecasting
- **Prophet** and **ARIMA** for time series, linear/ridge regression as baseline
- Confidence intervals, MAE · RMSE · MAPE, train/test split visualised
- Streaming anomaly flags on newly arriving data

### ◈ Visual Composer
- Configurable charts: type, axes, grouping, color, filters, aggregations
- Auto-suggested charts after ingestion
- Dashboard grid builder, drag · resize · export
- Natural-language → chart spec (stretch goal)
- Export: PNG · SVG · interactive HTML · raw spec JSON

### ◈ Pipelines as Config
- Every run is a saved, versioned `pipeline.json`
- Re-run on fresh data with one click
- Full lineage and audit trail

---

## ❖ Repository Map

```
DataDeck/
├── README.md                  ← you are here
├── docs/
│   ├── ARCHITECTURE.md        ← system design, modules, data flow
│   ├── DESIGN_SYSTEM.md       ← the maximalist-white visual language
│   ├── PIPELINE_SPEC.md       ← pipeline.json schema & outlier strategies
│   ├── CHART_SPEC.md          ← portable chart-spec schema
│   ├── API.md                 ← REST endpoints
│   └── ROADMAP.md             ← phased build plan
├── backend/                   ← FastAPI
├── frontend/                  ← React + Vite
└── docker-compose.yml
```

---

## ❖ Quick Start *(target workflow)*

```bash
# clone
git clone https://github.com/<you>/datadeck.git && cd datadeck

# backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` and drop a CSV onto the deck.

---

## ❖ Principles

1. **Transparency over magic.** Every change is logged, previewable, reversible.
2. **User in control.** Defaults are suggestions; the user always chooses.
3. **One spec to rule them all.** Pipelines and charts are plain JSON — portable, versionable, shareable.
4. **Safe by design.** Read-only DB connections, encrypted secrets, validated specs, no executed generated code.
5. **Beautiful on purpose.** See [`DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

---

## ❖ Status

`◐ Pre-alpha` — documentation phase. See [`ROADMAP.md`](docs/ROADMAP.md).

---

<div align="center">

▫ ▫ ▫

*DataDeck — your data, dealt face-up.*

</div>
