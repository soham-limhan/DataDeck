# ▫ DataDeck API

Base URL: `/api/v1` · JSON · Bearer-token auth · OpenAPI at `/docs`

---

## ❖ Sources

| Method | Path | Description |
|---|---|---|
| `POST` | `/sources` | Create a DB source (config encrypted at rest) |
| `POST` | `/sources/upload` | Upload CSV / JSON / XLSX |
| `POST` | `/sources/{id}/test` | Test connectivity |
| `GET` | `/sources` | List sources |
| `DELETE` | `/sources/{id}` | Remove a source and its stored credentials |

## ❖ Datasets

| Method | Path | Description |
|---|---|---|
| `GET` | `/sources/{id}/tables` | List tables / sheets |
| `POST` | `/datasets` | Register a dataset from a source + target |
| `GET` | `/datasets/{id}/schema` | Inferred schema |
| `GET` | `/datasets/{id}/preview?n=100` | Sample rows |
| `GET` | `/datasets/{id}/profile` | Per-column stats, null counts, outlier estimates |

## ❖ Pipelines

| Method | Path | Description |
|---|---|---|
| `POST` | `/pipelines` | Create a pipeline |
| `PUT` | `/pipelines/{id}` | Save a new version |
| `GET` | `/pipelines/{id}/versions` | List versions |
| `POST` | `/pipelines/{id}/dry-run` | Preview changes without applying |
| `POST` | `/pipelines/{id}/runs` | Execute a run (async) |

## ❖ Runs & Lineage

| Method | Path | Description |
|---|---|---|
| `GET` | `/runs/{id}` | Status and metrics |
| `GET` | `/runs/{id}/lineage` | Ordered lineage events |
| `POST` | `/runs/{id}/undo/{step}` | Revert to before a step |
| `GET` | `/runs/{id}/download?format=csv` | Cleaned data |
| `WS` | `/runs/{id}/stream` | Live progress |

## ❖ Forecasts

| Method | Path | Description |
|---|---|---|
| `POST` | `/runs/{id}/forecast` | Train and predict |
| `GET` | `/forecasts/{id}` | Predictions, intervals, metrics |

## ❖ Charts & Dashboards

| Method | Path | Description |
|---|---|---|
| `GET` | `/charts/suggest?run_id=` | Auto-suggested specs |
| `POST` | `/charts` | Save a spec (validated) |
| `GET` | `/charts/{id}/data` | Aggregated data for rendering |
| `POST` | `/charts/from-text` | *(stretch)* Natural language → spec |
| `POST` | `/dashboards` | Create a dashboard |
| `PUT` | `/dashboards/{id}` | Update layout |

---

## ❖ Error Format

```json
{
  "error": {
    "code": "SPEC_INVALID",
    "message": "A card slipped — field 'revnue' is not in this dataset.",
    "details": { "field": "encoding.y.field", "suggestions": ["revenue"] }
  }
}
```

Codes: `AUTH_REQUIRED` · `SOURCE_UNREACHABLE` · `SCHEMA_MISMATCH` · `SPEC_INVALID` · `EXPRESSION_REJECTED` · `RUN_FAILED` · `RATE_LIMITED`

---

──── ❖ ────
