# ▫ DataDeck Roadmap

Four phases. Each ends with something demonstrable.

---

## ◈ Phase 0 — Foundations
- [ ] Repo, folder structure, linting, CI
- [ ] Design tokens, textures, ornament SVGs, base components
- [ ] FastAPI skeleton, auth, Alembic migrations
- [ ] Docker Compose (app DB, Redis, backend, frontend)

**Demo:** the empty deck, fully styled.

---

## ◈ Phase 1 — Ingest
- [ ] CSV / JSON / XLSX loaders with type inference
- [ ] PostgreSQL and MySQL connectors (read-only)
- [ ] Credential vault
- [ ] Schema preview and column profile
- [ ] Parquet cache

**Demo:** drop a messy CSV or connect a database and see its profile.

---

## ◈ Phase 2 — Cleanse
- [ ] Detectors: IQR, Z-score, MAD, Isolation Forest, custom rule
- [ ] Actions: cap, drop, impute, flag
- [ ] Safe expression parser
- [ ] Dry-run diff UI with hatched outlier rows
- [ ] Lineage log and step-level undo
- [ ] Pipeline JSON save / version / re-run

**Demo:** clean a dataset, review every change, re-run on new data.

---

## ◈ Phase 3 — Forecast
- [ ] Baseline regression, ARIMA, Prophet
- [ ] Holdout validation and metrics
- [ ] Forecast view with hatched confidence bands
- [ ] Anomaly flags on new data

**Demo:** forecast a column and compare models by error.

---

## ◈ Phase 4 — Compose
- [ ] Chart spec schema and renderer with pattern fills
- [ ] Chart builder UI
- [ ] Auto-suggestions
- [ ] Layers: outliers, before/after, forecast
- [ ] Dashboard grid and exports (PNG · SVG · HTML · JSON)

**Demo:** build a dashboard from a cleaned, forecasted dataset.

---

## ◈ Stretch
- [ ] Natural-language → chart spec
- [ ] Scheduled runs
- [ ] Polars backend
- [ ] Shareable read-only dashboards
- [ ] Optional single-accent palette extension

---

## ◈ Open Decisions

| Decision | Revisit at |
|---|---|
| Single accent color for charts, or stay pure white + ink? | Phase 4 |
| BackgroundTasks vs Celery | Phase 2 |
| Pandas vs Polars | when files exceed memory comfort |
| Auth: own vs third-party | Phase 0 |

---

──── ❖ ────
