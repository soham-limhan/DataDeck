const API_BASE = "http://127.0.0.1:8000/api/v1";

export interface ColumnProfile {
  name: string;
  type: "temporal" | "quantitative" | "nominal" | "boolean";
  null_count: number;
  non_null_count: number;
  null_pct: number;
  unique_count: number;
  sample_values: any[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  q25?: number;
  q75?: number;
  outliers_estimate?: number;
}

export interface DatasetProfile {
  row_count: number;
  column_count: number;
  checksum: string;
  columns: ColumnProfile[];
}

export interface LineageEvent {
  step_index: number;
  op: string;
  column: string;
  method?: string;
  action: string;
  rows_affected: number;
  rows_before: number;
  rows_after: number;
  sample_changes: Array<{ row: number; before: any; after: any }>;
  before_hash: string;
  after_hash: string;
}

export interface ForecastResult {
  target_column: string;
  time_column?: string;
  model: string;
  horizon: number;
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    train_size: number;
    test_size: number;
  };
  historical: Array<{ date: string; actual: number }>;
  test_holdout: Array<{ date: string; actual: number; predicted: number }>;
  projection: Array<{ date: string; forecast: number; lower_bound: number; upper_bound: number }>;
}

export interface ChartSpec {
  spec_version: string;
  id: string;
  title: string;
  caption?: string;
  type: "line" | "bar" | "stacked_bar" | "area" | "scatter" | "histogram" | "box";
  encoding: {
    x: { field: string; type: string; aggregate?: string };
    y: { field: string; type: string; aggregate?: string };
    series?: { field: string; type: string };
  };
  layers?: Array<{ kind: string }>;
  style?: {
    palette?: string;
    pattern_by_series?: boolean;
    grid?: string;
    frame?: string;
    figure_label?: string;
  };
}

export const api = {
  async getDatasetProfile(): Promise<{ dataset_name: string; profile: DatasetProfile; history_depth: number; lineage_count: number }> {
    const res = await fetch(`${API_BASE}/datasets/profile`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getDatasetPreview(n: number = 50): Promise<{ total_rows: number; checksum: string; rows: any[] }> {
    const res = await fetch(`${API_BASE}/datasets/preview?n=${n}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async dealSample(): Promise<any> {
    const res = await fetch(`${API_BASE}/sources/sample`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/sources/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async dryRunCleanse(stepConfig: any): Promise<any> {
    const res = await fetch(`${API_BASE}/pipelines/dry-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stepConfig),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Dry-run failed");
    }
    return res.json();
  },

  async applyCleanseStep(stepConfig: any): Promise<{ event: LineageEvent; profile: DatasetProfile; total_steps: number }> {
    const res = await fetch(`${API_BASE}/pipelines/apply-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stepConfig),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Step execution failed");
    }
    return res.json();
  },

  async undoStep(): Promise<any> {
    const res = await fetch(`${API_BASE}/pipelines/undo`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Undo failed");
    }
    return res.json();
  },

  async resetDeck(): Promise<any> {
    const res = await fetch(`${API_BASE}/pipelines/reset`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getLineageLog(): Promise<{ dataset_name: string; total_steps: number; current_checksum: string; events: LineageEvent[] }> {
    const res = await fetch(`${API_BASE}/pipelines/lineage`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async executeForecast(params: {
    target_column: string;
    time_column?: string;
    horizon: number;
    model: string;
  }): Promise<ForecastResult> {
    const res = await fetch(`${API_BASE}/forecasts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Forecast failed");
    }
    return res.json();
  },

  async getChartSuggestions(): Promise<{ suggestions: ChartSpec[] }> {
    const res = await fetch(`${API_BASE}/charts/suggest`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getChartData(spec: ChartSpec): Promise<{ spec_id: string; points: any[]; forecast_layer?: ForecastResult }> {
    const res = await fetch(`${API_BASE}/charts/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getDownloadUrl(): string {
    return `${API_BASE}/datasets/download`;
  }
};
