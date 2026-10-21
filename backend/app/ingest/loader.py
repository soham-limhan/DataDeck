import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.core.config import DATA_DIR

def calculate_checksum(df: pd.DataFrame) -> str:
    """Calculate an MD5 hash of dataframe content for lineage tracking."""
    # Convert dataframe to a deterministic json representation for hashing
    try:
        content = df.head(1000).to_json(date_format='iso', orient='split')
        return hashlib.md5(content.encode('utf-8')).hexdigest()[:8]
    except Exception:
        return "hash_err"

def infer_column_type(series: pd.Series) -> str:
    """Infer high-level DataDeck type: temporal, quantitative, nominal, or boolean."""
    clean_series = series.dropna()
    if len(clean_series) == 0:
        return "nominal"
    
    # Check boolean
    if pd.api.types.is_bool_dtype(clean_series):
        return "boolean"
    if clean_series.isin([0, 1, "0", "1", True, False, "true", "false", "True", "False"]).all() and len(clean_series.unique()) <= 2:
        return "boolean"
        
    # Check numeric
    if pd.api.types.is_numeric_dtype(clean_series):
        return "quantitative"

    # Check temporal
    if pd.api.types.is_datetime64_any_dtype(clean_series):
        return "temporal"
    
    # Attempt datetime parse on sample
    sample = clean_series.head(50)
    try:
        converted = pd.to_datetime(sample, errors='coerce')
        if converted.notnull().mean() > 0.8:
            return "temporal"
    except Exception:
        pass

    return "nominal"

def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate thorough column profile, missing stats, and initial outlier estimates."""
    columns_profile = []
    total_rows = len(df)
    
    for col in df.columns:
        s = df[col]
        col_type = infer_column_type(s)
        null_count = int(s.isnull().sum())
        non_null_count = total_rows - null_count
        unique_count = int(s.nunique(dropna=True))
        
        # Representative sample values
        samples = [None if pd.isna(v) else (v.isoformat() if hasattr(v, 'isoformat') else v) for v in s.dropna().head(5).tolist()]
        
        stats: Dict[str, Any] = {
            "name": col,
            "type": col_type,
            "null_count": null_count,
            "non_null_count": non_null_count,
            "null_pct": round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0,
            "unique_count": unique_count,
            "sample_values": samples,
            "outliers_estimate": 0
        }
        
        if col_type == "quantitative":
            num_s = pd.to_numeric(s, errors='coerce').dropna()
            if len(num_s) > 0:
                q25 = float(num_s.quantile(0.25))
                q75 = float(num_s.quantile(0.75))
                iqr = q75 - q25
                lower_bound = q25 - 1.5 * iqr
                upper_bound = q75 + 1.5 * iqr
                outliers = num_s[(num_s < lower_bound) | (num_s > upper_bound)]
                
                stats.update({
                    "min": float(num_s.min()),
                    "max": float(num_s.max()),
                    "mean": round(float(num_s.mean()), 2),
                    "median": round(float(num_s.median()), 2),
                    "std": round(float(num_s.std()), 2) if len(num_s) > 1 else 0.0,
                    "q25": round(q25, 2),
                    "q75": round(q75, 2),
                    "outliers_estimate": int(len(outliers))
                })
                
        columns_profile.append(stats)
        
    return {
        "row_count": total_rows,
        "column_count": len(df.columns),
        "checksum": calculate_checksum(df),
        "columns": columns_profile
    }

def generate_sample_sales_data(filepath: Path) -> pd.DataFrame:
    """Generate realistic sales dataset containing intentional outliers, missing values, and seasonal trends."""
    np.random.seed(42)
    dates = pd.date_range(start="2025-01-01", periods=365, freq="D")
    regions = ["North", "South", "East", "West"]
    categories = ["Hardware", "Software", "Cloud Services", "Advisory"]
    
    rows = []
    base_price = {"Hardware": 450, "Software": 120, "Cloud Services": 280, "Advisory": 600}
    
    for d in dates:
        # daily volume between 1 and 4 transactions
        n_trans = np.random.randint(1, 4)
        for _ in range(n_trans):
            cat = np.random.choice(categories)
            reg = np.random.choice(regions)
            units = np.random.randint(1, 20)
            
            # seasonal ramp + random noise
            day_of_year = d.dayofyear
            seasonal_factor = 1.0 + 0.3 * np.sin(2 * np.pi * day_of_year / 365)
            rev = base_price[cat] * units * seasonal_factor * np.random.uniform(0.85, 1.15)
            discount = np.random.choice([0.0, 0.05, 0.10, 0.15, 0.20])
            rating = round(np.random.uniform(3.2, 5.0), 1)
            
            rows.append({
                "order_date": d.strftime("%Y-%m-%d"),
                "region": reg,
                "category": cat,
                "units_sold": units,
                "revenue": round(rev, 2),
                "discount_rate": discount,
                "customer_rating": rating
            })
            
    df = pd.DataFrame(rows)
    
    # Inject deliberate real-world messiness:
    # 1. Extreme outliers (typographical extra zero)
    typo_indices = [23, 114, 280, 450]
    for idx in typo_indices:
        if idx < len(df):
            df.loc[idx, "revenue"] = round(df.loc[idx, "revenue"] * 12.5, 2)
            
    # 2. Negative outlier (returns or clerical error)
    if len(df) > 70:
        df.loc[70, "revenue"] = -1450.0
    if len(df) > 310:
        df.loc[310, "units_sold"] = -15
        
    # 3. Missing values
    missing_indices = [45, 99, 180, 240, 390]
    for idx in missing_indices:
        if idx < len(df):
            df.loc[idx, "revenue"] = np.nan
            
    df.to_csv(filepath, index=False)
    return df

def get_or_create_sample_dataset() -> pd.DataFrame:
    sample_path = DATA_DIR / "sample_sales_deck.csv"
    if not sample_path.exists():
        return generate_sample_sales_data(sample_path)
    return pd.read_csv(sample_path)
