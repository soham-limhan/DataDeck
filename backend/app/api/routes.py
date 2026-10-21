import io
from typing import Any, Dict, List, Optional
import pandas as pd
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from app.ingest.loader import (
    calculate_checksum,
    get_or_create_sample_dataset,
    profile_dataset,
)
from app.cleanse.engine import run_dry_run, apply_step
from app.forecast.engine import run_forecast
from app.compose.suggest import generate_suggestions

router = APIRouter()

# In-memory deck state management for seamless studio operations
class DeckState:
    def __init__(self):
        self.raw_df: Optional[pd.DataFrame] = None
        self.current_df: Optional[pd.DataFrame] = None
        self.history: List[pd.DataFrame] = []
        self.lineage_events: List[Dict[str, Any]] = []
        self.forecast_result: Optional[Dict[str, Any]] = None
        self.dataset_name: str = "sample_sales_deck.csv"
        
    def load(self, df: pd.DataFrame, name: str = "dataset.csv"):
        self.raw_df = df.copy()
        self.current_df = df.copy()
        self.history = [df.copy()]
        self.lineage_events = []
        self.forecast_result = None
        self.dataset_name = name
        
    def reset(self):
        if self.raw_df is not None:
            self.current_df = self.raw_df.copy()
            self.history = [self.raw_df.copy()]
            self.lineage_events = []
            self.forecast_result = None

deck = DeckState()

# Ensure sample data is initialized
sample_df = get_or_create_sample_dataset()
deck.load(sample_df, "sample_sales_deck.csv")

class StepRequest(BaseModel):
    op: str = "outliers"
    column: str
    detector: Optional[Dict[str, Any]] = None
    action: Optional[Dict[str, Any]] = None
    group_by: Optional[List[str]] = None

class ForecastRequest(BaseModel):
    target_column: str
    time_column: Optional[str] = None
    horizon: int = 30
    model: str = "seasonal"
    confidence_level: float = 0.95
    test_fraction: float = 0.2

@router.get("/sources/sample")
def deal_sample_source():
    """Deal in the curated default sales deck dataset."""
    sample = get_or_create_sample_dataset()
    deck.load(sample, "sample_sales_deck.csv")
    profile = profile_dataset(deck.current_df)
    return {
        "message": "Sample deck dealt successfully.",
        "dataset_name": deck.dataset_name,
        "profile": profile
    }

@router.post("/sources/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV or JSON file into the deck."""
    contents = await file.read()
    filename = file.filename or "uploaded.csv"
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(contents))
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            # Try CSV fallback
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"A card slipped — unable to parse '{filename}': {str(e)}"
        )
        
    deck.load(df, filename)
    profile = profile_dataset(deck.current_df)
    return {
        "message": f"Dealt in '{filename}' with {len(df)} rows.",
        "dataset_name": filename,
        "profile": profile
    }

@router.get("/datasets/profile")
def get_dataset_profile():
    """Retrieve full column schema, null stats, and outlier estimates."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active deck found. Deal a dataset first.")
    profile = profile_dataset(deck.current_df)
    return {
        "dataset_name": deck.dataset_name,
        "profile": profile,
        "history_depth": len(deck.history),
        "lineage_count": len(deck.lineage_events)
    }

@router.get("/datasets/preview")
def get_dataset_preview(n: int = Query(50, ge=1, le=500)):
    """Retrieve top N sample rows with metadata."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active deck.")
    
    sample = deck.current_df.head(n).copy()
    # Serialize datetimes and NAs
    sample_records = []
    for _, row in sample.iterrows():
        d = {}
        for k, v in row.items():
            if pd.isna(v):
                d[k] = None
            elif hasattr(v, "isoformat"):
                d[k] = v.isoformat()
            else:
                d[k] = v
        sample_records.append(d)
        
    return {
        "total_rows": len(deck.current_df),
        "total_columns": len(deck.current_df.columns),
        "checksum": calculate_checksum(deck.current_df),
        "rows": sample_records
    }

@router.get("/datasets/download")
def download_dataset():
    """Download cleaned dataset as CSV."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    csv_str = deck.current_df.to_csv(index=False)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_{deck.dataset_name}"}
    )

@router.post("/pipelines/dry-run")
def dry_run_cleanse_step(req: StepRequest):
    """Dry-run outlier or missing step without mutating state."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    
    result = run_dry_run(deck.current_df, req.model_dump())
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/pipelines/apply-step")
def commit_cleanse_step(req: StepRequest):
    """Execute cleansing step, append lineage record, and update deck state."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
        
    new_df, event = apply_step(deck.current_df, req.model_dump())
    if "error" in event:
        raise HTTPException(status_code=400, detail=event["error"])
        
    deck.history.append(new_df.copy())
    deck.current_df = new_df
    event["step_index"] = len(deck.lineage_events) + 1
    deck.lineage_events.append(event)
    
    return {
        "event": event,
        "profile": profile_dataset(deck.current_df),
        "total_steps": len(deck.lineage_events)
    }

@router.post("/pipelines/undo")
def undo_last_step():
    """Revert the most recent transformation step."""
    if len(deck.history) <= 1:
        raise HTTPException(status_code=400, detail="Cannot undo: at initial deal state.")
        
    # Pop current state
    deck.history.pop()
    deck.current_df = deck.history[-1].copy()
    undone_event = deck.lineage_events.pop() if deck.lineage_events else None
    
    return {
        "message": "Reverted previous transformation.",
        "undone_event": undone_event,
        "profile": profile_dataset(deck.current_df),
        "remaining_steps": len(deck.lineage_events)
    }

@router.post("/pipelines/reset")
def reset_pipeline():
    """Reset the entire deck back to original raw state."""
    deck.reset()
    return {
        "message": "Reset deck to original deal.",
        "profile": profile_dataset(deck.current_df)
    }

@router.get("/pipelines/lineage")
def get_lineage_log():
    """Retrieve ordered lineage log with audit trail and hashes."""
    return {
        "dataset_name": deck.dataset_name,
        "total_steps": len(deck.lineage_events),
        "current_checksum": calculate_checksum(deck.current_df) if deck.current_df is not None else "",
        "events": deck.lineage_events
    }

@router.post("/forecasts")
def execute_forecast(req: ForecastRequest):
    """Train forecast model and project future confidence bands."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
        
    res = run_forecast(
        deck.current_df,
        target_column=req.target_column,
        time_column=req.time_column,
        horizon=req.horizon,
        model_type=req.model,
        confidence_level=req.confidence_level,
        test_fraction=req.test_fraction
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
        
    deck.forecast_result = res
    return res

@router.get("/charts/suggest")
def get_chart_suggestions():
    """Get rule-based chart specifications grounded in the dataset."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    profile = profile_dataset(deck.current_df)
    suggestions = generate_suggestions(
        profile["columns"],
        has_forecast=deck.forecast_result is not None
    )
    return {"suggestions": suggestions}

@router.post("/charts/data")
def get_chart_data(spec: Dict[str, Any]):
    """Prepare rendering data points according to a chart specification."""
    if deck.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
        
    df = deck.current_df.copy()
    encoding = spec.get("encoding", {})
    x_enc = encoding.get("x", {})
    y_enc = encoding.get("y", {})
    s_enc = encoding.get("series", {})
    
    x_field = x_enc.get("field")
    y_field = y_enc.get("field")
    s_field = s_enc.get("field") if s_enc else None
    agg = y_enc.get("aggregate")
    
    if x_field not in df.columns or y_field not in df.columns:
        return {"error": "Specified fields not found in active dataset."}
        
    # Aggregate or downsample
    if agg and s_field and s_field in df.columns:
        grouped = df.groupby([x_field, s_field])[y_field].agg(agg).reset_index()
        records = grouped.to_dict(orient="records")
    elif agg:
        grouped = df.groupby(x_field)[y_field].agg(agg).reset_index()
        records = grouped.to_dict(orient="records")
    else:
        # Sample top 150 points for responsive rendering
        sample = df[[x_field, y_field] + ([s_field] if s_field and s_field in df.columns else [])].dropna().head(150)
        records = sample.to_dict(orient="records")
        
    return {
        "spec_id": spec.get("id"),
        "points": records,
        "forecast_layer": deck.forecast_result if spec.get("layers") else None
    }
