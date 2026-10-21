import React, { useEffect, useRef, useState } from "react";
import { BarChart3, Download, Code2, Sparkles, SlidersHorizontal, Layers, Check } from "lucide-react";
import { ChartSpec, api } from "../api";

interface ComposeStageProps {
  onExport: () => void;
}

export const ComposeStage: React.FC<ComposeStageProps> = ({ onExport }) => {
  const [suggestions, setSuggestions] = useState<ChartSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<ChartSpec | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getChartSuggestions();
      setSuggestions(res.suggestions);
      if (res.suggestions.length > 0) {
        selectChart(res.suggestions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChart = async (spec: ChartSpec) => {
    setSelectedSpec(spec);
    setIsLoading(true);
    try {
      const dataRes = await api.getChartData(spec);
      setChartData(dataRes.points || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!chartSvgRef.current) return;
    const svgContent = chartSvgRef.current.outerHTML;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSpec?.id || "chart"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonSpec = () => {
    if (!selectedSpec) return;
    const blob = new Blob([JSON.stringify(selectedSpec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSpec.id || "spec"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render SVG using Maximalist-White Pattern Language
  const renderVisual = () => {
    if (!selectedSpec || chartData.length === 0) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)" }}>
          Dealing in chart points...
        </div>
      );
    }

    const width = 760;
    const height = 340;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xField = selectedSpec.encoding.x.field;
    const yField = selectedSpec.encoding.y.field;
    const seriesField = selectedSpec.encoding.series?.field;

    // Check unique series
    const seriesSet = Array.from(new Set(chartData.map((d) => d[seriesField || ""] || "default")));
    const patternIds = ["hatchDiag", "hatchCross", "hatchDots", "hatchH", "hatchV"];
    const markerShapes = ["circle", "rect", "triangle", "diamond"];

    if (selectedSpec.type === "bar" || selectedSpec.type === "stacked_bar") {
      // Bar Chart with Distinct Pattern Fills
      const categories = Array.from(new Set(chartData.map((d) => String(d[xField]))));
      const maxVal = Math.max(...chartData.map((d) => Number(d[yField]) || 0)) * 1.15 || 100;
      const barSlot = chartW / categories.length;
      const barWidth = Math.min(48, barSlot * 0.65);

      return (
        <svg ref={chartSvgRef} viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
          <defs>
            <pattern id="hatchDiag" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" strokeWidth="1.5" />
            </pattern>
            <pattern id="hatchCross" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M0 0L8 8ZM8 0L0 8Z" stroke="var(--ink)" strokeWidth="1.2" />
            </pattern>
            <pattern id="hatchDots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="var(--ink)" />
            </pattern>
            <pattern id="hatchH" width="6" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="3" x2="6" y2="3" stroke="var(--ink)" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Dotted Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = padding.top + chartH * ratio;
            return (
              <g key={ratio}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--white-50)" strokeDasharray="2,3" />
                <text x={padding.left - 8} y={y + 4} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-muted)" textAnchor="end">
                  {Math.round(maxVal - ratio * maxVal)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {categories.map((cat, idx) => {
            const match = chartData.find((d) => String(d[xField]) === cat);
            const val = match ? Number(match[yField]) || 0 : 0;
            const barH = (val / maxVal) * chartH;
            const x = padding.left + idx * barSlot + (barSlot - barWidth) / 2;
            const y = padding.top + chartH - barH;
            const patId = patternIds[idx % patternIds.length];

            return (
              <g key={cat}>
                {/* Solid white backing */}
                <rect x={x} y={y} width={barWidth} height={barH} fill="var(--white-100)" />
                {/* Pattern fill */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill={`url(#${patId})`}
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                />
                <text
                  x={x + barWidth / 2}
                  y={padding.top + chartH + 16}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fill="var(--ink)"
                  textAnchor="middle"
                >
                  {cat.slice(0, 10)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--ink)"
                  textAnchor="middle"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    // Default: Multi-series Line / Scatter Chart
    const xVals = chartData.map((d) => d[xField]);
    const yVals = chartData.map((d) => Number(d[yField]) || 0);
    const minY = Math.min(...yVals) * 0.95;
    const maxY = Math.max(...yVals) * 1.05;
    const yRange = maxY - minY || 1;

    const getX = (idx: number) => padding.left + (idx / Math.max(1, chartData.length - 1)) * chartW;
    const getY = (val: number) => padding.top + chartH - ((val - minY) / yRange) * chartH;

    const linePath = chartData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(Number(d[yField]) || 0).toFixed(1)}`)
      .join(" ");

    return (
      <svg ref={chartSvgRef} viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        {/* Horizontal Dotted Rules */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
          const y = padding.top + chartH * ratio;
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--white-50)" strokeDasharray="2,3" />
              <text x={padding.left - 8} y={y + 4} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-muted)" textAnchor="end">
                {Math.round(maxY - ratio * yRange)}
              </text>
            </g>
          );
        })}

        {/* Ink Line */}
        <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />

        {/* Marker Points with Geometric Variation */}
        {chartData.slice(0, 30).map((d, i) => {
          const cx = getX(i);
          const cy = getY(Number(d[yField]) || 0);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="4" fill="var(--white-100)" stroke="var(--ink)" strokeWidth="1.8" />
              <circle cx={cx} cy={cy} r="1.5" fill="var(--ink)" />
            </g>
          );
        })}

        {/* Axis Ticks */}
        <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="var(--ink)" strokeWidth="1.5" />
      </svg>
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
          CARD ④ · VISUAL COMPOSER & SPEC RENDERER
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            color: "var(--ink)",
            fontWeight: 700,
          }}
        >
          Compose & export visuals.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontStyle: "italic",
            color: "var(--ink-soft)",
            fontSize: "15px",
          }}
        >
          Every visual is driven by a single portable chart spec. Encoded with form and patterns, not rainbow colors.
        </p>
      </div>

      {/* Auto-Suggestion Spec Strip */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            marginBottom: "8px",
          }}
        >
          AUTO-SUGGESTED CHARTS
        </div>

        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
          {suggestions.map((spec) => {
            const isSelected = selectedSpec?.id === spec.id;
            return (
              <button
                key={spec.id}
                onClick={() => selectChart(spec)}
                style={{
                  minWidth: "220px",
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  border: isSelected ? "1.5px solid var(--ink)" : "1px solid var(--white-50)",
                  background: isSelected ? "var(--white-100)" : "var(--white-80)",
                  boxShadow: isSelected ? "var(--shadow-2)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all var(--t-fast) var(--ease)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--ink-muted)" }}>
                    {spec.style?.figure_label || spec.id}
                  </span>
                  <span style={{ fontSize: "10px", padding: "1px 5px", background: "var(--white-60)", borderRadius: "3px" }}>
                    {spec.type}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                  {spec.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--ink-muted)", fontStyle: "italic" }}>
                  {spec.encoding.x.field} × {spec.encoding.y.field}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Canvas Card */}
      {selectedSpec && (
        <div
          className="bracket-frame"
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-3)",
          }}
        >
          {/* Chart Header Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              borderBottom: "1px dashed var(--white-40)",
              paddingBottom: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--ink-muted)",
                }}
              >
                {selectedSpec.style?.figure_label || "Fig. 1"} · {selectedSpec.type.toUpperCase()}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {selectedSpec.title}
              </h3>
              {selectedSpec.caption && (
                <div
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontStyle: "italic",
                    fontSize: "13px",
                    color: "var(--ink-soft)",
                    marginTop: "2px",
                  }}
                >
                  {selectedSpec.caption}
                </div>
              )}
            </div>

            {/* Visual Type & Export Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => setShowJson(!showJson)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 10px",
                  background: "var(--white-80)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                <Code2 size={12} />
                <span>{showJson ? "Hide Spec" : "View Spec"}</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  background: "var(--white-80)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                <Download size={12} />
                <span>Export SVG</span>
              </button>

              <button
                onClick={handleDownloadJsonSpec}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  background: "var(--ink)",
                  color: "var(--white-100)",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={12} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Render Spec JSON when toggled */}
          {showJson ? (
            <pre
              style={{
                background: "var(--white-70)",
                padding: "16px",
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink)",
                overflowX: "auto",
                border: "1px solid var(--white-40)",
                boxShadow: "var(--deboss)",
              }}
            >
              {JSON.stringify(selectedSpec, null, 2)}
            </pre>
          ) : (
            renderVisual()
          )}
        </div>
      )}
    </div>
  );
};
