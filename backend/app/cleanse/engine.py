import math
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from app.cleanse.detectors import detect_outliers
from app.cleanse.actions import apply_action
from app.ingest.loader import calculate_checksum

def clean_row_for_json(row_dict: dict) -> dict:
    """Ensure no NaN or Infinite floats exist in serialized dictionaries."""
    cleaned = {}
    for k, v in row_dict.items():
        if pd.isna(v) or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned

def clean_changes_for_json(changes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cleaned = []
    for c in changes:
        item = {}
        for k, v in c.items():
            if pd.isna(v) or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
                item[k] = None
            else:
                item[k] = v
        cleaned.append(item)
    return cleaned

def run_dry_run(df: pd.DataFrame, step_config: Dict[str, Any]) -> Dict[str, Any]:
    """Execute dry-run without mutating original dataset, returning row diffs and hatching indicators."""
    op = step_config.get("op", "outliers")
    column = step_config.get("column", "")
    
    if column not in df.columns:
        return {
            "error": f"A card slipped — column '{column}' does not exist in dataset."
        }
        
    before_hash = calculate_checksum(df)
    total_before = len(df)
    
    if op == "outliers":
        detector = step_config.get("detector", {})
        method = detector.get("method", "iqr")
        params = detector.get("params", {})
        group_by = step_config.get("group_by", None)
        
        mask = detect_outliers(df, column, method=method, params=params, group_by=group_by)
        action = step_config.get("action", {"type": "cap", "params": {"lower_percentile": 1, "upper_percentile": 99}})
        action_type = action.get("type", "cap")
        action_params = action.get("params", {})
        
        projected_df, details = apply_action(df, column, mask, action_type, action_params)
        after_hash = calculate_checksum(projected_df)
        total_after = len(projected_df)
        
        # Build preview items with hatching tags
        affected_indices = set(df.index[mask].tolist())
        preview_rows = []
        for i in range(min(50, len(df))):
            row_dict = clean_row_for_json(df.iloc[i].to_dict())
            is_outlier = i in affected_indices
            row_dict["_is_outlier"] = is_outlier
            if is_outlier and action_type != "drop" and i in projected_df.index:
                val = projected_df.loc[i, column]
                row_dict["_proposed_value"] = None if pd.isna(val) else val
            elif is_outlier and action_type == "drop":
                row_dict["_proposed_value"] = "<drop>"
            preview_rows.append(row_dict)
            
        return {
            "op": op,
            "column": column,
            "rows_affected": details["affected_count"],
            "rows_before": total_before,
            "rows_after": total_after,
            "before_hash": before_hash,
            "after_hash": after_hash,
            "sample_changes": clean_changes_for_json(details["sample_changes"]),
            "preview_rows": preview_rows
        }
        
    elif op == "missing":
        # Handle null / NaN values
        mask = df[column].isnull()
        action = step_config.get("action", {"type": "impute", "params": {"strategy": "median"}})
        action_type = action.get("type", "impute")
        action_params = action.get("params", {})
        
        projected_df, details = apply_action(df, column, mask, action_type, action_params)
        after_hash = calculate_checksum(projected_df)
        
        affected_indices = set(df.index[mask].tolist())
        preview_rows = []
        for i in range(min(50, len(df))):
            row_dict = clean_row_for_json(df.iloc[i].to_dict())
            is_affected = i in affected_indices
            row_dict["_is_affected"] = is_affected
            if is_affected and action_type != "drop" and i in projected_df.index:
                val = projected_df.loc[i, column]
                row_dict["_proposed_value"] = None if pd.isna(val) else val
            preview_rows.append(row_dict)
            
        return {
            "op": op,
            "column": column,
            "rows_affected": details["affected_count"],
            "rows_before": total_before,
            "rows_after": len(projected_df),
            "before_hash": before_hash,
            "after_hash": after_hash,
            "sample_changes": clean_changes_for_json(details["sample_changes"]),
            "preview_rows": preview_rows
        }
        
    return {"error": f"Unknown operation '{op}'"}

def apply_step(df: pd.DataFrame, step_config: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Execute cleansing step and return the updated dataframe and lineage event record."""
    op = step_config.get("op", "outliers")
    column = step_config.get("column", "")
    before_hash = calculate_checksum(df)
    total_before = len(df)
    
    if op == "outliers":
        detector = step_config.get("detector", {})
        method = detector.get("method", "iqr")
        params = detector.get("params", {})
        group_by = step_config.get("group_by", None)
        
        mask = detect_outliers(df, column, method=method, params=params, group_by=group_by)
        action = step_config.get("action", {"type": "cap", "params": {}})
        action_type = action.get("type", "cap")
        action_params = action.get("params", {})
        
        new_df, details = apply_action(df, column, mask, action_type, action_params)
        after_hash = calculate_checksum(new_df)
        
        lineage_event = {
            "op": op,
            "column": column,
            "method": method,
            "action": action_type,
            "rows_affected": details["affected_count"],
            "rows_before": total_before,
            "rows_after": len(new_df),
            "sample_changes": clean_changes_for_json(details["sample_changes"]),
            "before_hash": before_hash,
            "after_hash": after_hash
        }
        return new_df, lineage_event
        
    elif op == "missing":
        mask = df[column].isnull()
        action = step_config.get("action", {"type": "impute", "params": {"strategy": "median"}})
        action_type = action.get("type", "impute")
        action_params = action.get("params", {})
        
        new_df, details = apply_action(df, column, mask, action_type, action_params)
        after_hash = calculate_checksum(new_df)
        
        lineage_event = {
            "op": op,
            "column": column,
            "action": action_type,
            "rows_affected": details["affected_count"],
            "rows_before": total_before,
            "rows_after": len(new_df),
            "sample_changes": clean_changes_for_json(details["sample_changes"]),
            "before_hash": before_hash,
            "after_hash": after_hash
        }
        return new_df, lineage_event
        
    return df, {"error": "Unsupported step"}
