from typing import List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

def detect_iqr(series: pd.Series, k: float = 1.5) -> pd.Series:
    """Interquartile Range Outlier Detector."""
    clean = pd.to_numeric(series, errors='coerce').dropna()
    if len(clean) < 4:
        return pd.Series(False, index=series.index)
        
    q25 = clean.quantile(0.25)
    q75 = clean.quantile(0.75)
    iqr = q75 - q25
    lower = q25 - k * iqr
    upper = q75 + k * iqr
    
    num_s = pd.to_numeric(series, errors='coerce')
    return (num_s < lower) | (num_s > upper)

def detect_zscore(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    """Standard Z-Score Outlier Detector."""
    clean = pd.to_numeric(series, errors='coerce').dropna()
    if len(clean) < 4:
        return pd.Series(False, index=series.index)
        
    mean = clean.mean()
    std = clean.std()
    if std == 0 or np.isnan(std):
        return pd.Series(False, index=series.index)
        
    num_s = pd.to_numeric(series, errors='coerce')
    z = (num_s - mean).abs() / std
    return z > threshold

def detect_mad(series: pd.Series, threshold: float = 3.5) -> pd.Series:
    """Median Absolute Deviation (Modified Z-score) Detector."""
    clean = pd.to_numeric(series, errors='coerce').dropna()
    if len(clean) < 4:
        return pd.Series(False, index=series.index)
        
    median = clean.median()
    mad = (clean - median).abs().median()
    if mad == 0 or np.isnan(mad):
        return pd.Series(False, index=series.index)
        
    num_s = pd.to_numeric(series, errors='coerce')
    modified_z = 0.6745 * (num_s - median).abs() / mad
    return modified_z > threshold

def detect_isolation_forest(df: pd.DataFrame, columns: List[str], contamination: float = 0.03) -> pd.Series:
    """Isolation Forest Multivariate / Univariate Outlier Detector."""
    sub_df = df[columns].apply(pd.to_numeric, errors='coerce').fillna(0)
    if len(sub_df) < 10:
        return pd.Series(False, index=df.index)
        
    model = IsolationForest(contamination=contamination, random_state=42)
    preds = model.fit_predict(sub_df)
    return pd.Series(preds == -1, index=df.index)

def detect_outliers(
    df: pd.DataFrame,
    column: str,
    method: str = "iqr",
    params: Optional[dict] = None,
    group_by: Optional[List[str]] = None
) -> pd.Series:
    """Run detector with optional group-aware partitioning."""
    params = params or {}
    
    if group_by and all(g in df.columns for g in group_by):
        # Run detection within each group
        mask = pd.Series(False, index=df.index)
        for _, group_indices in df.groupby(group_by).groups.items():
            group_series = df.loc[group_indices, column]
            group_mask = _run_detector_single(df.loc[group_indices], group_series, column, method, params)
            mask.loc[group_indices] = group_mask
        return mask
    else:
        return _run_detector_single(df, df[column], column, method, params)

def _run_detector_single(df: pd.DataFrame, series: pd.Series, column: str, method: str, params: dict) -> pd.Series:
    method = method.lower()
    if method == "iqr":
        k = float(params.get("k", 1.5))
        return detect_iqr(series, k=k)
    elif method == "zscore":
        thresh = float(params.get("threshold", 3.0))
        return detect_zscore(series, threshold=thresh)
    elif method == "mad":
        thresh = float(params.get("threshold", 3.5))
        return detect_mad(series, threshold=thresh)
    elif method == "isolation_forest":
        contamination = float(params.get("contamination", 0.03))
        cols = params.get("columns", [column])
        return detect_isolation_forest(df, cols, contamination=contamination)
    else:
        # Default to IQR
        return detect_iqr(series, k=1.5)
