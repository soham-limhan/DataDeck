<div align="center">

# ▫ D A T A D E C K ▫

### *Ingest. Cleanse. Forecast. Compose. Present.*

**An illuminated data-pipeline studio where every transformation is visible, reversible, and user-controlled.**

`FastAPI` · `React 19` · `TypeScript` · `Vite` · `pandas` · `scikit-learn` · `Pure CSS Tokens`

◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎ ◻︎

</div>

---

## ❖ The Premise

Most data tools perform cleaning behind opaque routines, alter records without logging, and discard discarded rows in silence.

**DataDeck deals your data face-up.**

Every file or table passes through a five-stage card stack. Every outlier rule is previewed before it takes effect. Every transformation writes a signed entry to an immutable lineage log. When a step goes wrong, an operator can revert it with one click.

---

## ❖ The Five-Stage Deck

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  STAGE RAIL                                     │
│  ① Ingest  →  ② Cleanse  →  ③ Forecast  →  ④ Compose  →  ⑤ Dashboard  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Card | Stage | Capabilities |
|:---:|---|---|
| **①** | **Ingest** | Connect tabular files (CSV, JSON, XLSX) or load the bundled sample sales deck. Automatic type inference categorizes columns as quantitative, nominal, or temporal. Generates instantaneous column histograms, null ratios, distinct counts, and an initial dataset SHA-256 checksum. |
| **②** | **Cleanse** | Inspect distributions and isolate anomalies using statistical detectors: **IQR** (configurable k multiplier), **Z-Score**, **Modified Z-Score (MAD)**, or **Isolation Forest**. Choose remediation per column: **Cap/Winsorize** to percentiles, **Drop** rows, **Impute** (median, mean, mode), or **Flag** into a dedicated boolean column. Dry-run previews compare before-and-after distributions side by side before changes apply. |
| **③** | **Forecast** | Project future values along time or sequential row indexes. Employs seasonal trend decomposition and linear regression baselines. Evaluates model accuracy against holdout splits with honest metrics (MAE, RMSE, MAPE). Computes confidence bands (80% and 95%) and plots projected trajectories against historical series. |
| **④** | **Compose** | Generates rule-based chart specifications grounded directly in column schemas. Produces scatter plots, time series lines, grouped bars, and multi-series comparisons. Every chart is serialized to a declarative JSON grammar of graphics, rendered as pure vector SVG, and exportable as SVG assets or portable JSON specs. |
| **⑤** | **Dashboard** | An interactive canvas combining reactive multi-card filtering (primary category, secondary dimension, full-text substring search), KPI metric summary cards, dynamic aggregation charts, and sample data views. |

---

## ❖ The Lineage Log & Inspector

To the right of the card stack sits the studio **Inspector**:

- **Column Telemetry:** Live statistical summary of the selected column, including inferred type, null ratio, mean, standard deviation, extremes, and frequent categorical values.
- **Audit Lineage:** A sequential log recording each committed step, operation type, detector parameters, affected row count, and cryptographic state checksums (`before_hash` → `after_hash`).
- **One-Click Revert:** Revert any transformation step to restore the exact previous state from memory.
- **Dossier Generation:** The Report Generator builds formal printable and downloadable audit reports (HTML or print-to-PDF) documenting the entire pipeline provenance, data health metrics, and model evaluations.

---

## ❖ Design Aesthetic: Maximalist White

DataDeck is built upon the **Maximalist White** visual language detailed in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). Rather than relying on stark, sterile minimalism or saturated rainbow accents, DataDeck derives visual hierarchy from tactile depth:

- **Twelve Tonal Whites:** A graduated palette ranging from `--white-100` (pure paper) down to `--white-10` (ash-white), with ivory sidebars (`--white-80`) and pearl inset wells (`--white-70`).
- **Graphite & Ink:** Pure `#1C1B18` (Ink) and `#4A4840` (Graphite) are reserved exclusively for typography, tabular figures, and data marks.
- **Tactile Shadows:** Multi-stop warm shadows (`--shadow-1` through `--shadow-4`) combined with emboss and deboss borders create elevation without artificial colors.
- **Geometric Data Differentiation:** Series in data charts are distinguished through form: marker geometries (circles, diamonds, squares), stroke weights, dash patterns (`dasharray`), and SVG hatchings.
- **Typographic System:** *Fraunces* for editorial headings, *Inter* for interface mechanics, *JetBrains Mono* for tabular numbers and hashes, and *Cormorant Garamond* for classical accents.

---

## ❖ System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + TypeScript + Vite)         │
│  Stage Rail · Card Stack · Inspector · SVG Visualizers · Modals    │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │  REST API (JSON / FormData)
┌─────────────────────────────────▼──────────────────────────────────┐
│                    BACKEND (FastAPI + Python 3.10+)                │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Ingest       │  │ Cleanse      │  │ Forecast     │              │
│  │ (loader.py)  │  │ (engine.py)  │  │ (engine.py)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                      │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐              │
│  │ Compose      │  │ Lineage Log  │  │ In-Memory    │              │
│  │ (suggest.py) │  │ & Undo Stack │  │ Deck State   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└────────────────────────────────────────────────────────────────────┘
```

### Backend Structure (`backend/app/`)
- `main.py`: FastAPI application entrypoint with CORS middleware and routing.
- `api/routes.py`: Endpoints for file ingestion, profiling, dry-run previews, step commits, undo operations, lineage logs, forecasts, and chart rendering.
- `ingest/loader.py`: Chunked file parsing, automatic column classification, null analysis, distribution statistics, and checksum calculation.
- `cleanse/detectors.py`: Vectorized outlier detection algorithms (IQR, Z-Score, MAD, Isolation Forest).
- `cleanse/actions.py`: Data transformation operators (Cap, Drop, Impute, Flag).
- `cleanse/engine.py`: Dry-run simulation and immutable step execution.
- `forecast/engine.py`: Time-series projection models, holdout validation, confidence band estimation, and error metrics calculation.
- `compose/chart_spec.py`: Pydantic schema for the portable chart grammar.
- `compose/suggest.py`: Heuristic rules suggesting optimal chart configurations based on column profiles.

### Frontend Structure (`frontend/src/`)
- `tokens.css`: The complete token definition for the 12 tonal whites, warm shadow elevations, and typographic rules.
- `App.tsx`: Central coordinator managing active stages, selected column telemetry, lineage state, and modal visibility.
- `components/StageRail.tsx`: Left stage rail for navigating cards ① through ⑤.
- `components/CardStack.tsx`: Center workspace displaying active stage cards with rotation fanning accents.
- `components/Inspector.tsx`: Right-hand telemetry pane and reversible audit log.
- `components/Marquee.tsx`: Header status bar displaying active dataset metrics, row totals, checksums, and export triggers.
- `components/ReportModal.tsx`: Dossier generator producing printable and downloadable provenance audit documents.
- `stages/`: Individual stages for Ingest, Cleanse, Forecast, Compose, and Dashboard.

---

## ❖ Quick Start

### Prerequisites
- Python 3.10 or newer
- Node.js 18 or newer
- npm or pnpm

### 1. Clone the Repository
```bash
git clone https://github.com/soham-limhan/DataDeck.git
cd DataDeck
```

### 2. Set Up the Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Linux/macOS:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
The API server will listen on `http://localhost:8000`. Interactive documentation is available at `http://localhost:8000/docs`.

### 3. Set Up the Frontend
Open a new terminal window:
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser. The default sample sales deck loads automatically.

---

## ❖ API Reference

### Ingestion & Datasets
- `GET /api/sources/sample`: Loads the curated default sales deck dataset.
- `POST /api/sources/upload`: Accepts CSV, JSON, or XLSX files via multipart form upload.
- `GET /api/datasets/profile`: Returns full column schema, inferred data types, null ratios, and distribution metrics.
- `GET /api/datasets/preview?n=50`: Returns the top N sample rows formatted for JSON serialization.
- `GET /api/datasets/download`: Exports the current dataset state as a CSV file.

### Pipelines & Cleansing
- `POST /api/pipelines/dry-run`: Runs an outlier or transformation check without altering dataset state; returns affected row counts, boundary thresholds, and preview rows.
- `POST /api/pipelines/apply-step`: Applies a cleansing operation, pushes the previous state to the undo stack, appends an event to the lineage log, and returns the updated schema profile.
- `POST /api/pipelines/undo`: Reverts the most recent transformation step and restores previous dataset state.
- `POST /api/pipelines/reset`: Restores the dataset to its initial uploaded state.
- `GET /api/pipelines/lineage`: Returns the chronological audit log containing step parameters, row counts, and before/after checksums.

### Forecasting
- `POST /api/forecasts`: Fits a forecasting model (seasonal or baseline) on a selected target column, returning historical points, projected values, 80%/95% confidence intervals, and evaluation metrics (MAE, RMSE, MAPE).

### Compose & Visualizations
- `GET /api/charts/suggest`: Returns chart specifications inferred from active dataset column profiles.
- `POST /api/charts/data`: Aggregates, filters, and groups dataset records according to a chart specification for client-side rendering.

---

## ❖ Technical Principles

1. **Deterministic Verification:** Every transformation step recalculates a SHA-256 state checksum. Lineage events record both before and after hashes to guarantee audit reproducibility.
2. **Preview Before Mutation:** Cleanse operations support dry-run evaluation. Operators inspect affected values and distributional shifts before committing changes to data.
3. **Reversible History:** The deck maintains an in-memory stack of transformation states, permitting immediate undo operations without loss of prior states.
4. **Decoupled Specifications:** Pipeline rules and chart definitions exist as portable, human-readable JSON documents independent of runtime code.
5. **No Visual Compromise:** Interface design, tabular mechanics, and visual hierarchy receive the same engineering rigor as the numerical backend.

---

## ❖ Documentation Index

For deeper architectural, aesthetic, and schema documentation:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): System components, data flows, and connector interfaces.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md): Maximalist White token specifications, shadow formulas, and typographic rules.
- [`docs/PIPELINE_SPEC.md`](docs/PIPELINE_SPEC.md): Schema definitions for `pipeline.json` and outlier strategy parameters.
- [`docs/CHART_SPEC.md`](docs/CHART_SPEC.md): Portable grammar of graphics JSON schema.
- [`docs/API.md`](docs/API.md): Detailed REST endpoints, request payloads, and status codes.
- [`docs/ROADMAP.md`](docs/ROADMAP.md): Phased development milestones and roadmap.

---

<div align="center">

▫ ▫ ▫

*DataDeck: your data, dealt face-up.*

</div>
