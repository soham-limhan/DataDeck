# ▫ DataDeck Pipeline Spec

A pipeline is a **plain JSON document**. It is versioned, diffable, shareable, and re-runnable on new data.

---

## ❖ 1. Top-level Shape

```json
{
  "spec_version": "1.0",
  "name": "Monthly Sales Cleanup",
  "source": {
    "kind": "csv",
    "ref": "sales_2025.csv"
  },
  "steps": [ ... ],
  "forecast": { ... },
  "outputs": { "cache": "parquet", "charts": ["chart_01", "chart_02"] }
}
```

---

## ❖ 2. Step Types

| `op` | Purpose |
|---|---|
| `select` | Choose / rename / reorder columns |
| `cast` | Force a column type |
| `dedupe` | Remove duplicate rows |
| `missing` | Handle null / NaN values |
| `outliers` | Detect and handle outliers |
| `derive` | Create a column from a safe expression |
| `filter` | Keep rows matching a safe expression |

Steps execute **in order**. Each emits one lineage event.

---

## ❖ 3. The `outliers` Step

```json
{
  "op": "outliers",
  "column": "revenue",
  "detector": {
    "method": "iqr",
    "params": { "k": 1.5 }
  },
  "action": {
    "type": "cap",
    "params": { "lower_percentile": 1, "upper_percentile": 99 }
  },
  "group_by": ["region"],
  "dry_run_preview": true
}
```

### Detectors

| `method` | Params | Notes |
|---|---|---|
| `iqr` | `k` (default 1.5) | Robust, good default |
| `zscore` | `threshold` (default 3) | Assumes roughly normal data |
| `mad` | `threshold` (default 3.5) | Robust Z-score |
| `isolation_forest` | `contamination`, `n_estimators`, `columns[]` | Multivariate |
| `custom` | `expression` | Safe expression, e.g. `revenue > 5 * median(revenue)` |

### Actions

| `type` | Params | Effect |
|---|---|---|
| `cap` | percentile bounds *or* explicit `lower` / `upper` | Winsorize |
| `drop` | — | Remove rows |
| `impute` | `strategy`: `mean` · `median` · `interpolate` · `constant` | Replace values |
| `flag` | `flag_column` | Add boolean column, leave data unchanged |

### Group-aware detection
`group_by` runs the detector **within each group**, so "outlier for region A" is judged against region A.

---

## ❖ 4. The `missing` Step

```json
{
  "op": "missing",
  "column": "price",
  "action": { "type": "impute", "params": { "strategy": "median" } }
}
```

Actions: `drop_rows` · `impute` · `forward_fill` · `backward_fill` · `flag`.

---

## ❖ 5. Safe Expressions

`derive`, `filter`, and `custom` detectors use a **restricted expression language**:

- Allowed: column names, numbers, strings, `+ - * / %`, comparisons, `and / or / not`
- Allowed functions: `abs`, `round`, `min`, `max`, `mean`, `median`, `std`, `quantile`, `log`, `sqrt`, `isnull`
- Parsed to an AST and validated against a whitelist
- **No attribute access, imports, or arbitrary calls — ever**

---

## ❖ 6. The `forecast` Block

```json
{
  "target": "revenue",
  "time_column": "order_date",
  "frequency": "D",
  "horizon": 30,
  "model": "prophet",
  "params": { "seasonality_mode": "multiplicative" },
  "validation": { "type": "holdout", "test_fraction": 0.2 }
}
```

Models: `prophet` · `arima` · `linear` (baseline). Output includes forecast values, interval bounds, and MAE / RMSE / MAPE.

---

## ❖ 7. Lineage Event (emitted per step)

```json
{
  "run_id": "run_8f21",
  "step_index": 3,
  "op": "outliers",
  "column": "revenue",
  "rows_affected": 142,
  "rows_before": 12000,
  "rows_after": 12000,
  "sample_changes": [
    { "row": 441, "before": 98234.0, "after": 7411.5 }
  ],
  "before_hash": "ab12…",
  "after_hash": "9fe3…"
}
```

Every run can be replayed or **undone step by step**.

---

## ❖ 8. Versioning

- Editing a pipeline creates a new immutable `version`
- Runs always reference a specific version
- Diff view shows spec changes between versions

---

──── ❖ ────
