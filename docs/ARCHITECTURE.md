# ▫ DataDeck Architecture

---

## ❖ 1. System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND  (React + Vite)                   │
│  Stage Rail · Card Stack · Inspector · Visual Composer · Dashboard │
└──────────────────────────────┬─────────────────────────────────────┘
                               │  REST + WebSocket (job progress)
┌──────────────────────────────▼─────────────────────────────────────┐
│                         BACKEND  (FastAPI)                         │
│                                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Connect  │→│ Ingest   │→│ Cleanse  │→│ Forecast │→│ Compose  │  │
│  │ (vault)  │ │ (loaders)│ │(outliers)│ │ (ML)     │ │ (charts) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│        │            │            │            │            │       │
│        └────────────┴─────┬──────┴────────────┴────────────┘       │
│                           ▼                                        │
│                  Lineage & Audit Log                               │
└───────┬───────────────────┬────────────────────┬───────────────────┘
        │                   │                    │
┌───────▼──────┐   ┌────────▼───────┐   ┌────────▼────────┐
│ App DB       │   │ Object store   │   │ Job queue       │
│ (PostgreSQL) │   │ (uploads,      │   │ (Celery + Redis │
│              │   │  parquet cache)│   │  or BG tasks)   │
└──────────────┘   └────────────────┘   └─────────────────┘
        ▲
        │ read-only
┌───────┴──────────────────────┐
│ User sources: PG · MySQL ·   │
│ CSV · JSON · XLSX            │
└──────────────────────────────┘
```

---

## ❖ 2. Backend Modules

```
backend/app/
├── main.py
├── core/            config, security, logging, errors
├── connectors/      base.py · postgres.py · mysql.py · file_csv.py · file_json.py · file_xlsx.py
├── vault/           encrypted credential storage (Fernet)
├── ingest/          schema inference · type coercion · chunked readers
├── cleanse/
│   ├── detectors/   iqr.py · zscore.py · mad.py · isolation_forest.py · custom_rule.py
│   ├── actions/     cap.py · drop.py · impute.py · flag.py
│   └── engine.py    dry-run + apply
├── forecast/        prophet_model.py · arima_model.py · baseline.py · metrics.py · anomaly.py
├── compose/         chart_spec.py (pydantic) · suggest.py · render_data.py · nl2spec.py (stretch)
├── pipeline/        spec.py · runner.py · versioning.py
├── lineage/         event log, diffs, undo
├── jobs/            task definitions, progress publisher
├── api/             routers: sources · datasets · pipelines · runs · charts · dashboards
└── db/              models · migrations (Alembic)
```

### Connector contract

```python
class Connector(Protocol):
    def test(self) -> ConnectionStatus: ...
    def schema(self) -> list[TableInfo]: ...
    def sample(self, target: str, n: int = 1000) -> DataFrame: ...
    def read(self, target: str, chunksize: int = 50_000) -> Iterator[DataFrame]: ...
```

All connectors normalize to a pandas `DataFrame` (Polars as a later optimization).

---

## ❖ 3. Data Model (App DB)

```
users            id · email · password_hash · created_at
sources          id · user_id · kind · name · encrypted_config · created_at
datasets         id · source_id · target · row_count · schema_json · cache_uri · created_at
pipelines        id · user_id · name · current_version
pipeline_versions id · pipeline_id · version · spec_json · created_at
runs             id · pipeline_version_id · dataset_id · status · started_at · finished_at · metrics_json
lineage_events   id · run_id · step_index · op · params_json · rows_affected · before_hash · after_hash · created_at
forecasts        id · run_id · target_column · model · params_json · metrics_json · result_uri
charts           id · user_id · dataset_id · spec_json · title · created_at
dashboards       id · user_id · title · layout_json · created_at
```

---

## ❖ 4. Request Flow — "Clean and Forecast a CSV"

1. **POST `/sources/upload`** → file stored, `Source` created
2. **GET `/datasets/{id}/schema`** → inferred types + preview rows
3. **POST `/pipelines/{id}/dry-run`** → engine returns *affected rows per step* without mutating
4. User reviews the diff, adjusts options
5. **POST `/pipelines/{id}/runs`** → job queued, progress streamed over WebSocket
6. Engine applies steps → writes cleaned parquet + `lineage_events`
7. **POST `/runs/{id}/forecast`** → model trained, result + metrics stored
8. **GET `/charts/suggest?run_id=`** → rule-based chart specs
9. **POST `/charts`** → save a spec; frontend renders it

---

## ❖ 5. Frontend Structure

```
frontend/src/
├── app/             routes, providers, theme
├── design/          tokens.css · textures · ornaments · stamps · patterns (SVG defs)
├── components/      Card · Ribbon · Button · Input · Table · Chip · Stamp · Modal
├── stages/
│   ├── ingest/      SourcePicker · SchemaPreview · ConnectionForm
│   ├── cleanse/     DetectorPanel · ColumnActions · DryRunDiff
│   ├── forecast/    ModelPicker · ForecastView · MetricsPanel
│   └── compose/     ChartBuilder · SuggestionStrip · DashboardGrid
├── charts/          renderer.tsx (spec → Plotly) · patterns.ts
├── inspector/       LineageLog · ColumnInfo
├── api/             typed client (generated from OpenAPI)
└── state/           Zustand stores: deck · dataset · pipeline · charts
```

**Key rule:** the chart renderer takes *only* a validated chart spec. No component builds Plotly options ad hoc.

---

## ❖ 6. Technology Choices

| Concern | Choice | Why |
|---|---|---|
| API | FastAPI + Pydantic v2 | typed, async, auto OpenAPI |
| Data | pandas (→ Polars later) | familiar, rich ecosystem |
| DB access | SQLAlchemy 2 | both PG and MySQL |
| Migrations | Alembic | standard |
| ML | scikit-learn, Prophet, statsmodels | outliers + forecasting |
| Jobs | FastAPI BackgroundTasks → Celery/Redis | start simple, scale when needed |
| Frontend | React + Vite + TypeScript | known stack |
| State | Zustand | lightweight |
| Charts | Plotly.js (custom pattern fills) | supports patterns, exports |
| Layout | react-grid-layout | dashboard builder |
| Styling | CSS variables + CSS Modules | token-driven design system |
| Secrets | `cryptography` Fernet | encrypted credentials |

---

## ❖ 7. Security

- DB connections **read-only by default**; enforced via read-only transactions
- Credentials encrypted at rest; never logged; never returned by the API
- File uploads: size cap, extension + MIME check, parsed in a sandboxed worker
- Custom outlier rules use a **safe expression parser** (no `eval`)
- NL→chart: LLM output is parsed into the chart-spec schema and rejected if invalid — **never executed**
- Per-user data isolation on every query
- Rate limits on upload and run endpoints

---

## ❖ 8. Performance

- Chunked readers; cache normalized datasets as **Parquet**
- Dry-run operates on a sample (default 50k rows) with full-run estimates
- Aggregate server-side for charts; cap points sent to the browser (LTTB downsampling)
- Long jobs run async with WebSocket progress

---

## ❖ 9. Testing

| Layer | Tooling |
|---|---|
| Detectors / actions | pytest with synthetic datasets of known outliers |
| Connectors | pytest + Dockerized Postgres/MySQL |
| Pipeline runner | golden-file tests (spec + input → expected output hash) |
| API | pytest + httpx |
| Frontend | Vitest + React Testing Library |
| Visual / E2E | Playwright with screenshot baselines (the design deserves it) |

---

──── ❖ ────
