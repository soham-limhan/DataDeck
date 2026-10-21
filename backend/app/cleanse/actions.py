from typing import Any, Dict, Tuple
import numpy as np
import pandas as pd

def apply_action(
    df: pd.DataFrame,
    column: str,
    mask: pd.Series,
    action_type: str,
    params: Dict[str, Any]
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Applies the specified cleanse action to the masked outlier rows.
    Returns the new dataframe along with transformation details (e.g., sample changes).
    """
    new_df = df.copy()
    affected_indices = df.index[mask].tolist()
    sample_changes = []
    
    if action_type == "flag":
        flag_col = params.get("flag_column", f"{column}_is_outlier")
        new_df[flag_col] = mask
        for idx in affected_indices[:10]:
            sample_changes.append({
                "row": int(idx),
                "before": df.loc[idx, column],
                "after": f"Flagged as outlier in {flag_col}"
            })
            
    elif action_type == "drop":
        for idx in affected_indices[:10]:
            sample_changes.append({
                "row": int(idx),
                "before": df.loc[idx, column],
                "after": "<dropped row>"
            })
        new_df = new_df.loc[~mask].reset_index(drop=True)
        
    elif action_type == "cap":
        # Winsorize / Cap values
        lower_pct = params.get("lower_percentile", 1)
        upper_pct = params.get("upper_percentile", 99)
        
        non_outliers = pd.to_numeric(df.loc[~mask, column], errors='coerce').dropna()
        if len(non_outliers) > 0:
            lower_val = non_outliers.quantile(lower_pct / 100.0)
            upper_val = non_outliers.quantile(upper_pct / 100.0)
        else:
            lower_val = df[column].min()
            upper_val = df[column].max()
            
        for idx in affected_indices:
            orig = df.loc[idx, column]
            if orig < lower_val:
                new_df.loc[idx, column] = round(lower_val, 2)
            elif orig > upper_val:
                new_df.loc[idx, column] = round(upper_val, 2)
                
            if len(sample_changes) < 10:
                sample_changes.append({
                    "row": int(idx),
                    "before": orig,
                    "after": new_df.loc[idx, column]
                })
                
    elif action_type == "impute":
        strategy = params.get("strategy", "median")
        non_outliers = pd.to_numeric(df.loc[~mask, column], errors='coerce').dropna()
        
        if strategy == "mean":
            replacement = round(non_outliers.mean(), 2) if len(non_outliers) > 0 else 0
        elif strategy == "median":
            replacement = round(non_outliers.median(), 2) if len(non_outliers) > 0 else 0
        elif strategy == "constant":
            replacement = params.get("value", 0)
        elif strategy == "interpolate":
            # Linear interpolation
            temp_s = df[column].copy()
            temp_s.loc[mask] = np.nan
            temp_s = temp_s.interpolate(method='linear').bfill().ffill()
            for idx in affected_indices:
                orig = df.loc[idx, column]
                new_val = round(temp_s.loc[idx], 2)
                new_df.loc[idx, column] = new_val
                if len(sample_changes) < 10:
                    sample_changes.append({"row": int(idx), "before": orig, "after": new_val})
            return new_df, {"sample_changes": sample_changes, "affected_count": len(affected_indices)}
        else:
            replacement = round(non_outliers.median(), 2)
            
        for idx in affected_indices:
            orig = df.loc[idx, column]
            new_df.loc[idx, column] = replacement
            if len(sample_changes) < 10:
                sample_changes.append({
                    "row": int(idx),
                    "before": orig,
                    "after": replacement
                })
                
    return new_df, {
        "sample_changes": sample_changes,
        "affected_count": len(affected_indices)
    }
