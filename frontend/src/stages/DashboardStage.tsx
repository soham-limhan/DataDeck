import React, { useMemo, useState } from "react";
import { Filter, Layers, BarChart3, TrendingUp, Search, X, Download, SlidersHorizontal, RefreshCcw } from "lucide-react";
import { DatasetProfile, ForecastResult, LineageEvent } from "../api";

interface DashboardStageProps {
  profile: DatasetProfile | null;
  rawRows: any[];
  forecastResult: ForecastResult | null;
  lineageEvents: LineageEvent[];
  onOpenReportModal: () => void;
}

export const DashboardStage: React.FC<DashboardStageProps> = ({
  profile,
  rawRows,
  forecastResult,
  lineageEvents,
  onOpenReportModal,
}) => {
  const nominalCols = profile?.columns.filter((c) => c.type === "nominal") || [];
  const quantCols = profile?.columns.filter((c) => c.type === "quantitative") || [];
  const temporalCols = profile?.columns.filter((c) => c.type === "temporal") || [];

  // Filter States
  const [selectedCategoryCol, setSelectedCategoryCol] = useState<string>(nominalCols[0]?.name || "");
  const [categoryFilterVal, setCategoryFilterVal] = useState<string>("ALL");
  const [selectedSecondaryCol, setSelectedSecondaryCol] = useState<string>(nominalCols[1]?.name || "");
  const [secondaryFilterVal, setSecondaryFilterVal] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [primaryMetricCol, setPrimaryMetricCol] = useState<string>(quantCols[0]?.name || "");
  const [timeCol, setTimeCol] = useState<string>(temporalCols[0]?.name || "");

  // Available unique values for filters
  const primaryOptions = useMemo(() => {
    if (!selectedCategoryCol || rawRows.length === 0) return [];
    return Array.from(new Set(rawRows.map((r) => String(r[selectedCategoryCol] ?? "")))).filter(Boolean);
  }, [selectedCategoryCol, rawRows]);

  const secondaryOptions = useMemo(() => {
    if (!selectedSecondaryCol || rawRows.length === 0) return [];
    return Array.from(new Set(rawRows.map((r) => String(r[selectedSecondaryCol] ?? "")))).filter(Boolean);
  }, [selectedSecondaryCol, rawRows]);

  // Compute Filtered Data Reactively
  const filteredRows = useMemo(() => {
    return rawRows.filter((r) => {
      // Primary category filter
      if (categoryFilterVal !== "ALL" && selectedCategoryCol) {
        if (String(r[selectedCategoryCol]) !== categoryFilterVal) return false;
      }
      // Secondary filter
      if (secondaryFilterVal !== "ALL" && selectedSecondaryCol) {
        if (String(r[selectedSecondaryCol]) !== secondaryFilterVal) return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(query)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [rawRows, categoryFilterVal, selectedCategoryCol, secondaryFilterVal, selectedSecondaryCol, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = filteredRows.length;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    filteredRows.forEach((r) => {
      const v = Number(r[primaryMetricCol]);
      if (!isNaN(v)) {
        sum += v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });

    const avg = total > 0 ? sum / total : 0;
    return {
      total,
      sum: Math.round(sum),
      avg: Math.round(avg * 10) / 10,
      min: min === Infinity ? 0 : Math.round(min),
      max: max === -Infinity ? 0 : Math.round(max),
      pctOfOriginal: rawRows.length > 0 ? Math.round((total / rawRows.length) * 100) : 100,
    };
  }, [filteredRows, primaryMetricCol, rawRows.length]);

  const clearFilters = () => {
    setCategoryFilterVal("ALL");
    setSecondaryFilterVal("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters = categoryFilterVal !== "ALL" || secondaryFilterVal !== "ALL" || searchQuery.trim().length > 0;

  // Breakdown Data for Bar Chart
  const categoryBreakdown = useMemo(() => {
    if (!selectedCategoryCol) return [];
    const grouped: { [key: string]: { count: number; sum: number } } = {};
    filteredRows.forEach((r) => {
      const k = String(r[selectedCategoryCol] ?? "Other");
      const v = Number(r[primaryMetricCol]) || 0;
      if (!grouped[k]) grouped[k] = { count: 0, sum: 0 };
      grouped[k].count += 1;
      grouped[k].sum += v;
    });
    return Object.entries(grouped).map(([label, d]) => ({
      label,
      count: d.count,
      val: Math.round(d.sum),
    }));
  }, [filteredRows, selectedCategoryCol, primaryMetricCol]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
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
            CARD ⑤ · INTERACTIVE DASHBOARD STUDIO
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              color: "var(--ink)",
              fontWeight: 700,
            }}
          >
            Filtered Deck Dashboard.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-accent)",
              fontStyle: "italic",
              color: "var(--ink-soft)",
              fontSize: "15px",
            }}
          >
            Sift records through custom category, threshold, and keyword filters. All visuals update synchronously.
          </p>
        </div>

        {/* Export Report Action */}
        <button
          onClick={onOpenReportModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            background: "var(--ink)",
            color: "var(--white-100)",
            border: "none",
            borderRadius: "var(--r-sm)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <Download size={13} />
          <span>Generate PDF Report</span>
        </button>
      </div>

      {/* Filter Control Console */}
      <div
        style={{
          background: "var(--white-100)",
          border: "1px solid var(--white-50)",
          borderRadius: "var(--r-lg)",
          padding: "20px 24px",
          boxShadow: "var(--shadow-2)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="var(--ink)" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink)",
              }}
            >
              CUSTOM DASHBOARD FILTERS
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "1px solid var(--white-40)",
                borderRadius: "var(--r-sm)",
                padding: "4px 8px",
                fontSize: "11px",
                color: "var(--ink-soft)",
                cursor: "pointer",
              }}
            >
              <RefreshCcw size={11} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1.4fr",
            gap: "14px",
          }}
        >
          {/* Primary Filter */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
              FILTER BY {selectedCategoryCol ? selectedCategoryCol.toUpperCase() : "CATEGORY"}
            </label>
            <select
              value={categoryFilterVal}
              onChange={(e) => setCategoryFilterVal(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--white-70)",
                border: "1px solid var(--white-40)",
                borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                boxShadow: "var(--deboss)",
              }}
            >
              <option value="ALL">All {selectedCategoryCol || "Categories"} ({rawRows.length})</option>
              {primaryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Filter */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
              FILTER BY {selectedSecondaryCol ? selectedSecondaryCol.toUpperCase() : "SEGMENT"}
            </label>
            <select
              value={secondaryFilterVal}
              onChange={(e) => setSecondaryFilterVal(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--white-70)",
                border: "1px solid var(--white-40)",
                borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                boxShadow: "var(--deboss)",
              }}
            >
              <option value="ALL">All {selectedSecondaryCol || "Segments"}</option>
              {secondaryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
              PRIMARY METRIC
            </label>
            <select
              value={primaryMetricCol}
              onChange={(e) => setPrimaryMetricCol(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--white-70)",
                border: "1px solid var(--white-40)",
                borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                boxShadow: "var(--deboss)",
              }}
            >
              {quantCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
              KEYWORD SEARCH
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search across any field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 30px",
                  background: "var(--white-70)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  boxShadow: "var(--deboss)",
                }}
              />
              <Search size={13} color="var(--ink-muted)" style={{ position: "absolute", left: "10px", top: "10px" }} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-md)",
            padding: "16px 20px",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}>
            FILTERED VOLUME
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--ink)" }}>
            {summary.total}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "2px" }}>
            {summary.pctOfOriginal}% of full deck ({rawRows.length} rows)
          </div>
        </div>

        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-md)",
            padding: "16px 20px",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}>
            AGGREGATE SUM ({primaryMetricCol})
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--ink)" }}>
            {summary.sum.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "2px" }}>
            Filtered total
          </div>
        </div>

        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-md)",
            padding: "16px 20px",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}>
            MEAN AVERAGE
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--ink)" }}>
            {summary.avg.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "2px" }}>
            Min: {summary.min} · Max: {summary.max}
          </div>
        </div>

        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-md)",
            padding: "16px 20px",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}>
            STRAYS CLEANSED
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--ink)" }}>
            {lineageEvents.reduce((acc, e) => acc + (e.rows_affected || 0), 0)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "2px" }}>
            {lineageEvents.length} step(s) recorded in lineage
          </div>
        </div>
      </div>

      {/* Multi-Tile Visual Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "20px",
        }}
      >
        {/* Tile 1: Category Breakdown Bar Chart */}
        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-lg)",
            padding: "20px",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
              borderBottom: "1px dashed var(--white-40)",
              paddingBottom: "10px",
            }}
          >
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--ink-muted)" }}>
                Fig. A · VOLUME BY {selectedCategoryCol.toUpperCase()}
              </span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
                Distribution of {primaryMetricCol}
              </div>
            </div>
            <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontStyle: "italic" }}>
              Pattern-filled bars
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ width: "100%", overflowX: "auto" }}>
            <svg viewBox="0 0 460 220" style={{ width: "100%", height: "auto" }}>
              <defs>
                <pattern id="dashDiag" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" strokeWidth="1.5" />
                </pattern>
                <pattern id="dashCross" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M0 0L8 8ZM8 0L0 8Z" stroke="var(--ink)" strokeWidth="1.2" />
                </pattern>
                <pattern id="dashDots" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="1.5" fill="var(--ink)" />
                </pattern>
              </defs>

              {(() => {
                const maxVal = Math.max(...categoryBreakdown.map((b) => b.val), 10);
                const barWidth = 32;
                const slotWidth = 400 / Math.max(1, categoryBreakdown.length);
                const patList = ["dashDiag", "dashCross", "dashDots"];

                return categoryBreakdown.map((item, idx) => {
                  const barH = (item.val / maxVal) * 140;
                  const x = 40 + idx * slotWidth + (slotWidth - barWidth) / 2;
                  const y = 170 - barH;
                  const pId = patList[idx % patList.length];

                  return (
                    <g key={item.label}>
                      <rect x={x} y={y} width={barWidth} height={barH} fill="var(--white-100)" />
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        fill={`url(#${pId})`}
                        stroke="var(--ink)"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={186}
                        fontFamily="var(--font-mono)"
                        fontSize="10"
                        fill="var(--ink)"
                        textAnchor="middle"
                      >
                        {item.label.slice(0, 8)}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        fontFamily="var(--font-mono)"
                        fontSize="9"
                        fontWeight="600"
                        fill="var(--ink)"
                        textAnchor="middle"
                      >
                        {item.val}
                      </text>
                    </g>
                  );
                });
              })()}
              <line x1="30" y1="170" x2="430" y2="170" stroke="var(--ink)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Tile 2: Primary Metric Trend over filtered stream */}
        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-lg)",
            padding: "20px",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
              borderBottom: "1px dashed var(--white-40)",
              paddingBottom: "10px",
            }}
          >
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--ink-muted)" }}>
                Fig. B · FILTERED STREAM RUN
              </span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
                {primaryMetricCol} Sequential Path
              </div>
            </div>
            <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontStyle: "italic" }}>
              {filteredRows.length} observations
            </span>
          </div>

          <div style={{ width: "100%", overflowX: "auto" }}>
            <svg viewBox="0 0 360 220" style={{ width: "100%", height: "auto" }}>
              {(() => {
                const samplePts = filteredRows.slice(0, 60);
                const vals = samplePts.map((r) => Number(r[primaryMetricCol]) || 0);
                const min = vals.length > 0 ? Math.min(...vals) : 0;
                const max = vals.length > 0 ? Math.max(...vals) : 100;
                const range = max - min || 1;

                const path = samplePts
                  .map((r, i) => {
                    const x = 30 + (i / Math.max(1, samplePts.length - 1)) * 300;
                    const y = 170 - (((Number(r[primaryMetricCol]) || 0) - min) / range) * 130;
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(" ");

                return (
                  <>
                    <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
                    {samplePts.slice(0, 15).map((r, i) => {
                      const x = 30 + (i / Math.max(1, samplePts.length - 1)) * 300;
                      const y = 170 - (((Number(r[primaryMetricCol]) || 0) - min) / range) * 130;
                      return (
                        <circle key={i} cx={x} cy={y} r="3" fill="var(--white-100)" stroke="var(--ink)" strokeWidth="1.5" />
                      );
                    })}
                    <line x1="25" y1="170" x2="335" y2="170" stroke="var(--ink)" strokeWidth="1.5" />
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Filtered Records Table Sample */}
      <div
        style={{
          background: "var(--white-100)",
          border: "1px solid var(--white-50)",
          borderRadius: "var(--r-lg)",
          padding: "20px",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "var(--ink)",
            }}
          >
            FILTERED DATA ROWS (SHOWING FIRST 15 OF {filteredRows.length})
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
            Live reactive slice
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ background: "var(--white-70)", borderBottom: "1px solid var(--white-40)" }}>
                <th style={{ padding: "8px 10px", textAlign: "left", width: "40px" }}>#</th>
                {profile?.columns.map((col) => (
                  <th key={col.name} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 15).map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid var(--white-50)",
                    background: idx % 2 === 1 ? "var(--white-60)" : "var(--white-100)",
                  }}
                >
                  <td style={{ padding: "7px 10px", color: "var(--ink-muted)" }}>{idx + 1}</td>
                  {profile?.columns.map((col) => (
                    <td key={col.name} style={{ padding: "7px 10px" }}>
                      {String(row[col.name] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
