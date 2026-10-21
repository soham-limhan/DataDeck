import React, { useState } from "react";
import { TrendingUp, Play, AlertCircle, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { DatasetProfile, ForecastResult, api } from "../api";

interface ForecastStageProps {
  profile: DatasetProfile | null;
  forecastResult: ForecastResult | null;
  onForecastCompleted: (res: ForecastResult) => void;
}

export const ForecastStage: React.FC<ForecastStageProps> = ({
  profile,
  forecastResult,
  onForecastCompleted,
}) => {
  // Allow all numeric and relevant columns
  const allCols = profile?.columns || [];
  const quantCols = allCols.filter((c) => c.type === "quantitative");
  const selectableTargetCols = quantCols.length > 0 ? quantCols : allCols;

  const [targetCol, setTargetCol] = useState<string>(
    selectableTargetCols[0]?.name || "revenue"
  );
  const [timeCol, setTimeCol] = useState<string>("Sequential");
  const [horizon, setHorizon] = useState<number>(14);
  const [modelType, setModelType] = useState<string>("seasonal");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrainAndForecast = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.executeForecast({
        target_column: targetCol,
        time_column: timeCol === "Sequential" ? undefined : timeCol,
        horizon: horizon,
        model: modelType,
      });
      onForecastCompleted(res);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Forecasting failed. Try switching TIME AXIS to '(Row Index / Sequential)'."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render SVG Chart for Forecast
  const renderForecastChart = () => {
    if (!forecastResult) return null;

    const historical = forecastResult.historical || [];
    const projection = forecastResult.projection || [];
    const allPoints = [...historical, ...projection];

    if (allPoints.length === 0) return null;

    const width = 840;
    const height = 340;
    const padding = { top: 35, right: 40, bottom: 45, left: 65 };

    const vals: number[] = [];
    historical.forEach((p) => {
      if (p.actual !== null && p.actual !== undefined) vals.push(p.actual);
    });
    projection.forEach((p) => {
      if (p.forecast !== null && p.forecast !== undefined) vals.push(p.forecast);
      if (p.lower_bound !== null && p.lower_bound !== undefined) vals.push(p.lower_bound);
      if (p.upper_bound !== null && p.upper_bound !== undefined) vals.push(p.upper_bound);
    });

    const minVal = vals.length > 0 ? Math.min(...vals) * 0.95 : 0;
    const maxVal = vals.length > 0 ? Math.max(...vals) * 1.05 : 100;
    const valRange = maxVal - minVal || 1;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (idx: number, total: number) =>
      padding.left + (idx / Math.max(1, total - 1)) * chartW;
    const getY = (val: number) =>
      padding.top + chartH - ((val - minVal) / valRange) * chartH;

    const totalPoints = historical.length + projection.length;

    // Historical line path
    const histPath = historical
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${getX(i, totalPoints).toFixed(1)} ${getY(
            p.actual ?? 0
          ).toFixed(1)}`
      )
      .join(" ");

    // Projection line path
    const projStartIndex = historical.length > 0 ? historical.length - 1 : 0;
    const projPoints =
      historical.length > 0
        ? [historical[historical.length - 1], ...projection]
        : projection;

    const projPath = projPoints
      .map((p: any, i) => {
        const globalIdx = projStartIndex + i;
        const val = p.forecast !== undefined ? p.forecast : p.actual;
        return `${i === 0 ? "M" : "L"} ${getX(globalIdx, totalPoints).toFixed(
          1
        )} ${getY(val ?? 0).toFixed(1)}`;
      })
      .join(" ");

    // Confidence Band Area (Upper & Lower)
    const upperPoints = projPoints.map((p: any, i) => {
      const globalIdx = projStartIndex + i;
      const val = p.upper_bound !== undefined ? p.upper_bound : p.actual;
      return `${getX(globalIdx, totalPoints).toFixed(1)},${getY(
        val ?? 0
      ).toFixed(1)}`;
    });

    const lowerPoints = projPoints
      .slice()
      .reverse()
      .map((p: any, i) => {
        const globalIdx = projStartIndex + (projPoints.length - 1 - i);
        const val = p.lower_bound !== undefined ? p.lower_bound : p.actual;
        return `${getX(globalIdx, totalPoints).toFixed(1)},${getY(
          val ?? 0
        ).toFixed(1)}`;
      });

    const bandPolygon = [...upperPoints, ...lowerPoints].join(" ");

    return (
      <div
        style={{
          background: "var(--white-100)",
          border: "1px solid var(--white-50)",
          borderRadius: "var(--r-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            borderBottom: "1px dashed var(--white-40)",
            paddingBottom: "14px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "var(--ink-muted)",
              }}
            >
              Fig. 3 · TIME SERIES PROJECTION & CONFIDENCE BAND
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {forecastResult.target_column} ({forecastResult.horizon}-Step Horizon)
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--ink-soft)",
                fontFamily: "var(--font-accent)",
                fontStyle: "italic",
              }}
            >
              Axis: {forecastResult.time_column} · Model: {forecastResult.model}
            </div>
          </div>

          {/* Validation Error Cards */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--ink-muted)", fontSize: "10px" }}>MAE ERROR</div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{forecastResult.metrics.mae ?? "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--ink-muted)", fontSize: "10px" }}>RMSE</div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{forecastResult.metrics.rmse ?? "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--ink-muted)", fontSize: "10px" }}>MAPE</div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                {forecastResult.metrics.mape !== undefined ? `${forecastResult.metrics.mape}%` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* SVG Drawing */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <pattern id="forecastHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="var(--white-30)" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Dotted Grid Horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = padding.top + chartH * ratio;
              const val = maxVal - ratio * valRange;
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="var(--white-50)"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                    fill="var(--ink-muted)"
                    textAnchor="end"
                  >
                    {Math.round(val)}
                  </text>
                </g>
              );
            })}

            {/* Confidence Band Polygon */}
            <polygon points={bandPolygon} fill="url(#forecastHatch)" stroke="var(--white-40)" strokeWidth="1" />

            {/* Historical Series */}
            <path d={histPath} fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />

            {/* Projection Series (Dashed) */}
            <path
              d={projPath}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2.2"
              strokeDasharray="6,4"
              strokeLinecap="round"
            />

            {/* Historical Sample Markers */}
            {historical.slice(-15).map((p, idx) => {
              const globalIdx = historical.length - 15 + idx;
              return (
                <circle
                  key={idx}
                  cx={getX(globalIdx, totalPoints)}
                  cy={getY(p.actual ?? 0)}
                  r="3.5"
                  fill="var(--white-100)"
                  stroke="var(--ink)"
                  strokeWidth="1.8"
                />
              );
            })}

            {/* Future Projection Markers */}
            {projection.map((p, idx) => {
              const globalIdx = projStartIndex + 1 + idx;
              return (
                <rect
                  key={idx}
                  x={getX(globalIdx, totalPoints) - 3}
                  y={getY(p.forecast ?? 0) - 3}
                  width="6"
                  height="6"
                  fill="var(--white-100)"
                  stroke="var(--ink)"
                  strokeWidth="1.8"
                />
              );
            })}

            {/* Legend strip */}
            <g transform={`translate(${padding.left + 10}, ${height - 10})`}>
              <line x1="0" y1="0" x2="20" y2="0" stroke="var(--ink)" strokeWidth="2" />
              <text x="26" y="3" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-soft)">
                Historical (Actual)
              </text>

              <line x1="160" y1="0" x2="180" y2="0" stroke="var(--ink)" strokeWidth="2" strokeDasharray="4,3" />
              <text x="186" y="3" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-soft)">
                Projection ({forecastResult.model})
              </text>

              <rect x="340" y="-5" width="16" height="10" fill="url(#forecastHatch)" stroke="var(--white-40)" />
              <text x="362" y="3" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-soft)">
                Hatched Confidence Band
              </text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stage Header */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            marginBottom: "4px",
          }}
        >
          CARD ③ · TIME SERIES FORECASTING & ERROR METRICS
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            color: "var(--ink)",
            fontWeight: 700,
          }}
        >
          Forecast the future stream.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontStyle: "italic",
            color: "var(--ink-soft)",
            fontSize: "15px",
          }}
        >
          Project volume, trend lines, and confidence intervals across any sequential or temporal series.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "14px 18px",
            background: "var(--white-70)",
            border: "1.5px solid var(--ink)",
            borderRadius: "var(--r-md)",
            fontSize: "13px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            boxShadow: "var(--deboss)",
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 700, color: "var(--ink)" }}>{errorMsg}</div>
            <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "4px" }}>
              Recommendation: Switch <strong>TIME AXIS</strong> to <code>(Row Index / Sequential)</code> to forecast consecutive steps without requiring continuous dates.
            </div>
          </div>
        </div>
      )}

      {/* Control Box */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.2fr 1.2fr 0.8fr auto",
          gap: "14px",
          alignItems: "flex-end",
          background: "var(--white-100)",
          border: "1px solid var(--white-50)",
          borderRadius: "var(--r-lg)",
          padding: "20px",
          boxShadow: "var(--shadow-2)",
        }}
      >
        {/* Target Metric */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            TARGET METRIC
          </label>
          <select
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--white-70)",
              border: "1px solid var(--white-40)",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              boxShadow: "var(--deboss)",
              color: "var(--ink)",
            }}
          >
            {selectableTargetCols.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Time Axis */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            TIME AXIS
          </label>
          <select
            value={timeCol}
            onChange={(e) => setTimeCol(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--white-70)",
              border: "1px solid var(--white-40)",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              boxShadow: "var(--deboss)",
              color: "var(--ink)",
            }}
          >
            <option value="Sequential">(Row Index / Sequential)</option>
            {allCols.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Model Architecture */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            MODEL ARCHITECTURE
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--white-70)",
              border: "1px solid var(--white-40)",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              boxShadow: "var(--deboss)",
              color: "var(--ink)",
            }}
          >
            <option value="seasonal">Prophet-Style (Seasonal & Trend)</option>
            <option value="arima">ARIMA (Autoregressive Lags)</option>
            <option value="linear">Baseline Ridge Regression</option>
          </select>
        </div>

        {/* Horizon Steps */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            HORIZON
          </label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(parseInt(e.target.value) || 14)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--white-70)",
              border: "1px solid var(--white-40)",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              boxShadow: "var(--deboss)",
              color: "var(--ink)",
            }}
          >
            <option value={7}>7 steps</option>
            <option value={14}>14 steps</option>
            <option value={30}>30 steps</option>
            <option value={60}>60 steps</option>
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleTrainAndForecast}
          disabled={isLoading}
          style={{
            padding: "9px 20px",
            background: "var(--ink)",
            color: "var(--white-100)",
            border: "none",
            borderRadius: "var(--r-sm)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "var(--shadow-2)",
            height: "38px",
          }}
        >
          <Play size={14} />
          <span>{isLoading ? "Fitting..." : "Train & Project"}</span>
        </button>
      </div>

      {/* Render Visual Chart */}
      {renderForecastChart()}
    </div>
  );
};
