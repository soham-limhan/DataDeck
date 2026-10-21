from typing import Any, Dict, List
from app.compose.chart_spec import ChartSpec, Encoding, ChannelEncoding, ChartStyle, ChartLayer

def generate_suggestions(columns_profile: List[Dict[str, Any]], has_forecast: bool = False) -> List[Dict[str, Any]]:
    """Auto-suggest chart specifications grounded in the dataset structure."""
    temporals = [c["name"] for c in columns_profile if c["type"] == "temporal"]
    quantitatives = [c["name"] for c in columns_profile if c["type"] == "quantitative"]
    nominals = [c["name"] for c in columns_profile if c["type"] == "nominal"]
    
    suggestions: List[Dict[str, Any]] = []
    fig_idx = 1
    
    # 1. Temporal + Quantitative (Trend line)
    if temporals and quantitatives:
        t_col = temporals[0]
        q_col = quantitatives[0]
        s_col = nominals[0] if nominals else None
        
        spec = ChartSpec(
            id=f"chart_{fig_idx:02d}",
            title=f"{q_col.replace('_', ' ').title()} Over Time",
            caption=f"Temporal trend of {q_col} grouped by {s_col if s_col else 'overall'}.",
            type="line",
            encoding=Encoding(
                x=ChannelEncoding(field=t_col, type="temporal"),
                y=ChannelEncoding(field=q_col, type="quantitative", aggregate="sum"),
                series=ChannelEncoding(field=s_col, type="nominal") if s_col else None
            ),
            style=ChartStyle(figure_label=f"Fig. {fig_idx}", grid="dotted")
        )
        if has_forecast:
            spec.layers.append(ChartLayer(kind="forecast_band"))
        suggestions.append(spec.model_dump())
        fig_idx += 1
        
    # 2. Categorical + Quantitative (Comparison Bar)
    if nominals and quantitatives:
        n_col = nominals[0]
        q_col = quantitatives[0]
        spec = ChartSpec(
            id=f"chart_{fig_idx:02d}",
            title=f"{q_col.replace('_', ' ').title()} by {n_col.replace('_', ' ').title()}",
            caption=f"Cross-category volume comparison with monochrome patterned fills.",
            type="bar",
            encoding=Encoding(
                x=ChannelEncoding(field=n_col, type="nominal"),
                y=ChannelEncoding(field=q_col, type="quantitative", aggregate="mean")
            ),
            style=ChartStyle(figure_label=f"Fig. {fig_idx}", grid="dotted")
        )
        suggestions.append(spec.model_dump())
        fig_idx += 1
        
    # 3. Two Numerics (Scatter)
    if len(quantitatives) >= 2:
        q1, q2 = quantitatives[0], quantitatives[1]
        spec = ChartSpec(
            id=f"chart_{fig_idx:02d}",
            title=f"{q1.title()} vs {q2.title()}",
            caption="Correlation scatter plot with hollow geometric markers.",
            type="scatter",
            encoding=Encoding(
                x=ChannelEncoding(field=q1, type="quantitative"),
                y=ChannelEncoding(field=q2, type="quantitative"),
                series=ChannelEncoding(field=nominals[0], type="nominal") if nominals else None
            ),
            style=ChartStyle(figure_label=f"Fig. {fig_idx}", grid="dotted")
        )
        suggestions.append(spec.model_dump())
        fig_idx += 1
        
    # 4. Distribution (Box / Histogram)
    if quantitatives:
        q_col = quantitatives[0]
        spec = ChartSpec(
            id=f"chart_{fig_idx:02d}",
            title=f"{q_col.title()} Spread & Outlier Bounds",
            caption="Distribution quartiles, median markers, and whisker bounds.",
            type="box",
            encoding=Encoding(
                x=ChannelEncoding(field=nominals[0], type="nominal") if nominals else ChannelEncoding(field="all", type="nominal"),
                y=ChannelEncoding(field=q_col, type="quantitative")
            ),
            style=ChartStyle(figure_label=f"Fig. {fig_idx}", grid="dotted")
        )
        suggestions.append(spec.model_dump())
        fig_idx += 1
        
    return suggestions
