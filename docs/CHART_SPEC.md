# ▫ DataDeck Chart Spec

One portable JSON format drives **every** visual: manual charts, auto-suggestions, saved dashboards, and (later) natural-language charts.

> **Rule:** the renderer accepts *only* a validated spec. Nothing builds chart options ad hoc.

---

## ❖ 1. Shape

```json
{
  "spec_version": "1.0",
  "id": "chart_01",
  "title": "Monthly Revenue, Cleansed",
  "caption": "Outliers capped at the 99th percentile.",
  "dataset": "run_8f21.cleaned",
  "type": "line",
  "encoding": {
    "x": { "field": "order_date", "type": "temporal" },
    "y": { "field": "revenue", "type": "quantitative", "aggregate": "sum" },
    "series": { "field": "region", "type": "nominal" }
  },
  "transforms": [
    { "filter": "revenue > 0" },
    { "bin": { "field": "order_date", "unit": "month" } }
  ],
  "layers": [
    { "kind": "outlier_markers", "source": "lineage" },
    { "kind": "forecast_band", "source": "forecast_01" }
  ],
  "style": {
    "palette": "whites-ink",
    "pattern_by_series": true,
    "grid": "dotted",
    "frame": "ornate",
    "figure_label": "Fig. 1"
  },
  "export": { "formats": ["png", "svg", "html", "json"] }
}
```

---

## ❖ 2. Chart Types

| `type` | Best for |
|---|---|
| `line` | trends over time |
| `bar` | category comparison |
| `stacked_bar` | part-to-whole by category |
| `area` | cumulative volume over time |
| `scatter` | relationship between two numerics |
| `histogram` | distributions |
| `box` | spread and outliers per group |
| `heatmap` | correlations, density |
| `table` | raw values with outlier hatching |

---

## ❖ 3. Encoding

| Channel | Meaning |
|---|---|
| `x`, `y` | positional axes |
| `series` | split into multiple marks |
| `size` | marker size (scatter) |
| `facet` | small multiples |

Field `type`: `quantitative` · `temporal` · `nominal` · `ordinal`.
Aggregates: `sum` · `mean` · `median` · `min` · `max` · `count` · `distinct`.

---

## ❖ 4. Layers

Layers attach pipeline intelligence to a chart:

| `kind` | Draws |
|---|---|
| `outlier_markers` | hollow double-ring points from the lineage log |
| `before_after` | original vs cleaned series overlaid |
| `forecast_line` | dashed projection |
| `forecast_band` | hatched confidence interval |
| `reference_line` | threshold or mean |

---

## ❖ 5. White-Palette Encoding

Because the palette is white, series are told apart by **form**:

```json
"pattern_cycle": ["solid", "diag-hatch", "cross-hatch", "dots", "h-lines", "v-lines"],
"marker_cycle":  ["circle", "square", "triangle", "diamond", "cross"],
"dash_cycle":    ["solid", "dash", "dot", "dash-dot"]
```

Sequential ramp: `#FFFFFF → #EFECE3 → #DDD8CA → #B9B3A1 → #4A4840 → #1C1B18`

See [`DESIGN_SYSTEM.md` §9](DESIGN_SYSTEM.md).

---

## ❖ 6. Auto-Suggestion Rules

Run right after ingestion:

| Columns present | Suggested chart |
|---|---|
| 1 temporal + 1 numeric | `line` |
| 1 categorical + 1 numeric | `bar` |
| 2 numerics | `scatter` |
| 1 numeric | `histogram` + `box` |
| many numerics | correlation `heatmap` |
| temporal + numeric after forecast | `line` with `forecast_band` |

---

## ❖ 7. Dashboards

```json
{
  "id": "dash_01",
  "title": "Sales Overview",
  "layout": [
    { "chart": "chart_01", "x": 0, "y": 0, "w": 8, "h": 5 },
    { "chart": "chart_02", "x": 8, "y": 0, "w": 4, "h": 5 }
  ]
}
```

12-column grid, matching the app layout.

---

## ❖ 8. Natural-Language → Spec *(stretch)*

1. User types: *"show monthly sales with outliers highlighted"*
2. An LLM receives the **dataset schema** and this spec's JSON Schema
3. It returns a candidate spec
4. Backend **validates** against the schema and checks every field name and type against the real dataset
5. Invalid → rejected with a readable reason. Valid → rendered.

**The LLM never generates executable code.**

---

## ❖ 9. Validation

Pydantic models are the source of truth; the JSON Schema is exported from them and shared with the frontend.

- Unknown fields → rejected
- Field not in dataset → rejected
- Aggregate on non-numeric → rejected
- Point count above cap → server-side downsampling (LTTB)

---

──── ❖ ────
