from typing import Any, Dict, List, Optional
import math
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error

def sanitize_float(val: float) -> Optional[float]:
    if pd.isna(val) or math.isnan(val) or math.isinf(val):
        return None
    return round(float(val), 2)

def run_forecast(
    df: pd.DataFrame,
    target_column: str,
    time_column: Optional[str] = None,
    horizon: int = 30,
    model_type: str = "seasonal",
    confidence_level: float = 0.95,
    test_fraction: float = 0.2
) -> Dict[str, Any]:
    """
    Trains forecasting model on temporal or sequential data, evaluates on holdout,
    and projects future points with confidence intervals and honest error metrics.
    Robust against arbitrary date/time formats, sparse points, and sequential row indices.
    """
    clean_df = df.copy()
    
    # 1. Prepare target column
    if target_column not in clean_df.columns:
        return {"error": f"Target column '{target_column}' does not exist in dataset."}
        
    clean_df[target_column] = pd.to_numeric(clean_df[target_column], errors='coerce')
    clean_df = clean_df.dropna(subset=[target_column])
    
    if len(clean_df) < 3:
        return {"error": f"Need at least 3 valid data points to project a trend (found {len(clean_df)})."}
        
    # 2. Prepare time/index gracefully
    use_sequential = False
    
    if time_column and time_column in clean_df.columns and time_column.lower() not in ["none", "sequential", "(row index / sequential)", ""]:
        # Attempt datetime parsing
        parsed_dates = pd.to_datetime(clean_df[time_column], errors='coerce')
        valid_date_count = parsed_dates.notnull().sum()
        
        # If at least 60% of dates parsed successfully
        if valid_date_count >= 3 and valid_date_count / len(clean_df) >= 0.5:
            clean_df["_parsed_time"] = parsed_dates
            clean_df = clean_df.dropna(subset=["_parsed_time"]).sort_values("_parsed_time")
            
            # Check if grouping by date reduces points below threshold
            unique_dates = clean_df["_parsed_time"].dt.date.nunique()
            
            if unique_dates >= 5 and unique_dates < len(clean_df):
                # Daily aggregate is viable
                agg_df = clean_df.groupby(clean_df["_parsed_time"].dt.date)[target_column].mean().reset_index()
                agg_df.columns = ["date", "val"]
                agg_df["date"] = pd.to_datetime(agg_df["date"])
            else:
                # Keep distinct timestamps or row records
                agg_df = pd.DataFrame({
                    "date": clean_df["_parsed_time"],
                    "val": clean_df[target_column].values
                }).reset_index(drop=True)
        else:
            use_sequential = True
    else:
        use_sequential = True
        
    if use_sequential:
        # Fallback to continuous daily sequence mapped to row index
        agg_df = pd.DataFrame({
            "date": pd.date_range(start="2025-01-01", periods=len(clean_df), freq="D"),
            "val": clean_df[target_column].values
        }).reset_index(drop=True)
        
    n_points = len(agg_df)
    if n_points < 3:
        return {"error": f"Insufficient sequential points for modeling (found {n_points}, need >= 3)."}
        
    y = agg_df["val"].values
    x = np.arange(n_points).reshape(-1, 1)
    
    # 3. Train/Test split for validation
    if n_points >= 8:
        n_test = max(2, int(n_points * test_fraction))
        n_train = n_points - n_test
    else:
        # For very small datasets, use minimal 1-point holdout
        n_test = 1
        n_train = n_points - 1
        
    x_train, y_train = x[:n_train], y[:n_train]
    x_test, y_test = x[n_train:], y[n_train:]
    
    # 4. Fit model
    model_type = model_type.lower()
    
    # Seasonal feature engineering
    day_of_year = agg_df["date"].dt.dayofyear.values
    sin_season = np.sin(2 * np.pi * day_of_year / 365.25).reshape(-1, 1)
    cos_season = np.cos(2 * np.pi * day_of_year / 365.25).reshape(-1, 1)
    
    if model_type == "linear" or n_points < 8:
        # Fallback to linear for small sets
        features = x
    elif model_type in ["arima", "autoregressive"]:
        lag1 = np.roll(y, 1).reshape(-1, 1)
        lag1[0] = lag1[1]
        features = np.hstack([x, lag1])
    else:
        # Seasonal decomposition
        features = np.hstack([x, sin_season, cos_season])
        
    reg = Ridge(alpha=1.0)
    reg.fit(features[:n_train], y_train)
    
    y_test_pred = reg.predict(features[n_train:])
    
    # 5. Validation metrics
    mae = float(mean_absolute_error(y_test, y_test_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
    
    non_zeros = y_test != 0
    if np.any(non_zeros):
        mape = float(np.mean(np.abs((y_test[non_zeros] - y_test_pred[non_zeros]) / y_test[non_zeros])) * 100)
    else:
        mape = 0.0
        
    # Residual standard deviation
    residuals = y_train - reg.predict(features[:n_train])
    std_residual = float(np.std(residuals)) if len(residuals) > 1 else (0.1 * abs(float(y.mean())) if y.mean() != 0 else 1.0)
    if std_residual == 0:
        std_residual = 0.05 * abs(float(y.mean())) if y.mean() != 0 else 1.0
        
    z_score = 1.96 if confidence_level >= 0.95 else 1.645
    
    # 6. Future Projection
    last_date = agg_df["date"].iloc[-1]
    
    # Infer frequency delta
    if len(agg_df) > 1:
        delta = (agg_df["date"].iloc[-1] - agg_df["date"].iloc[0]) / (len(agg_df) - 1)
        if delta.total_seconds() <= 0:
            delta = pd.Timedelta(days=1)
    else:
        delta = pd.Timedelta(days=1)
        
    future_dates = [last_date + (i + 1) * delta for i in range(horizon)]
    future_x = np.arange(n_points, n_points + horizon).reshape(-1, 1)
    
    if model_type == "linear" or n_points < 8:
        future_feats = future_x
        future_preds = reg.predict(future_feats)
    elif model_type in ["arima", "autoregressive"]:
        preds = []
        last_val = y[-1]
        for step_x in future_x:
            step_feats = np.hstack([step_x.reshape(1, -1), np.array([[last_val]])])
            next_val = float(reg.predict(step_feats)[0])
            preds.append(next_val)
            last_val = next_val
        future_preds = np.array(preds)
    else:
        future_doy = pd.Series(future_dates).dt.dayofyear.values
        future_sin = np.sin(2 * np.pi * future_doy / 365.25).reshape(-1, 1)
        future_cos = np.cos(2 * np.pi * future_doy / 365.25).reshape(-1, 1)
        future_feats = np.hstack([future_x, future_sin, future_cos])
        future_preds = reg.predict(future_feats)
        
    uncertainty_multiplier = np.sqrt(1 + np.arange(horizon) * 0.05)
    future_lower = future_preds - z_score * std_residual * uncertainty_multiplier
    future_upper = future_preds + z_score * std_residual * uncertainty_multiplier
    
    # 7. Payload formatting
    historical_points = []
    for d, v in zip(agg_df["date"], agg_df["val"]):
        historical_points.append({
            "date": d.strftime("%Y-%m-%d %H:%M") if hasattr(d, "strftime") else str(d),
            "actual": sanitize_float(v)
        })
        
    test_points = []
    for d, actual, pred in zip(agg_df["date"].iloc[n_train:], y_test, y_test_pred):
        test_points.append({
            "date": d.strftime("%Y-%m-%d %H:%M") if hasattr(d, "strftime") else str(d),
            "actual": sanitize_float(actual),
            "predicted": sanitize_float(pred)
        })
        
    future_points = []
    for d, pred, low, high in zip(future_dates, future_preds, future_lower, future_upper):
        future_points.append({
            "date": d.strftime("%Y-%m-%d %H:%M") if hasattr(d, "strftime") else str(d),
            "forecast": sanitize_float(pred),
            "lower_bound": sanitize_float(low),
            "upper_bound": sanitize_float(high)
        })
        
    return {
        "target_column": target_column,
        "time_column": time_column if not use_sequential else "Sequential / Row Index",
        "model": model_type if n_points >= 8 else "linear",
        "horizon": horizon,
        "metrics": {
            "mae": sanitize_float(mae),
            "rmse": sanitize_float(rmse),
            "mape": sanitize_float(mape),
            "train_size": n_train,
            "test_size": n_test
        },
        "historical": historical_points[-80:],
        "test_holdout": test_points,
        "projection": future_points
    }
