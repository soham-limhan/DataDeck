from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

class ChannelEncoding(BaseModel):
    field: str
    type: Literal["quantitative", "temporal", "nominal", "ordinal", "boolean"]
    aggregate: Optional[Literal["sum", "mean", "median", "min", "max", "count", "distinct"]] = None

class Encoding(BaseModel):
    x: ChannelEncoding
    y: ChannelEncoding
    series: Optional[ChannelEncoding] = None
    size: Optional[ChannelEncoding] = None

class ChartLayer(BaseModel):
    kind: Literal["outlier_markers", "before_after", "forecast_line", "forecast_band", "reference_line"]
    source: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

class ChartStyle(BaseModel):
    palette: str = "whites-ink"
    pattern_by_series: bool = True
    grid: str = "dotted"
    frame: str = "ornate"
    figure_label: str = "Fig. 1"

class ChartSpec(BaseModel):
    spec_version: str = "1.0"
    id: str
    title: str
    caption: Optional[str] = None
    type: Literal["line", "bar", "stacked_bar", "area", "scatter", "histogram", "box"] = "line"
    encoding: Encoding
    layers: List[ChartLayer] = Field(default_factory=list)
    style: ChartStyle = Field(default_factory=ChartStyle)
