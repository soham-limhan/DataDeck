import React, { useState } from "react";
import { Sparkles, Eye, Check, AlertCircle, ArrowRight, ShieldAlert, Filter } from "lucide-react";
import { DatasetProfile, api } from "../api";

interface CleanseStageProps {
  profile: DatasetProfile | null;
  onStepApplied: () => void;
}

export const CleanseStage: React.FC<CleanseStageProps> = ({ profile, onStepApplied }) => {
  const quantCols = profile?.columns.filter((c) => c.type === "quantitative") || [];
  const nominalCols = profile?.columns.filter((c) => c.type === "nominal") || [];

  const [selectedCol, setSelectedCol] = useState<string>(quantCols[0]?.name || "revenue");
  const [detectorMethod, setDetectorMethod] = useState<string>("iqr");
  const [iqrK, setIqrK] = useState<number>(1.5);
  const [zScoreThresh, setZScoreThresh] = useState<number>(3.0);
  const [madThresh, setMadThresh] = useState<number>(3.5);
  const [actionType, setActionType] = useState<string>("cap");
  const [imputeStrategy, setImputeStrategy] = useState<string>("median");
  const [groupByCol, setGroupByCol] = useState<string>("");

  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getStepPayload = () => {
    let params: any = {};
    if (detectorMethod === "iqr") params = { k: iqrK };
    if (detectorMethod === "zscore") params = { threshold: zScoreThresh };
    if (detectorMethod === "mad") params = { threshold: madThresh };
    if (detectorMethod === "isolation_forest") params = { contamination: 0.03 };

    let actionParams: any = {};
    if (actionType === "cap") actionParams = { lower_percentile: 1, upper_percentile: 99 };
    if (actionType === "impute") actionParams = { strategy: imputeStrategy };
    if (actionType === "flag") actionParams = { flag_column: `${selectedCol}_is_outlier` };

    return {
      op: "outliers",
      column: selectedCol,
      detector: { method: detectorMethod, params },
      action: { type: actionType, params: actionParams },
      group_by: groupByCol ? [groupByCol] : null,
    };
  };

  const handleDryRun = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.dryRunCleanse(getStepPayload());
      setDryRunResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Dry-run failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStep = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.applyCleanseStep(getStepPayload());
      setDryRunResult(null);
      onStepApplied();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit transformation");
    } finally {
      setIsLoading(false);
    }
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
          CARD ② · DETECT & REMEDIATE OUTLIERS
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            color: "var(--ink)",
            fontWeight: 700,
          }}
        >
          Cleanse with honest preview.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontStyle: "italic",
            color: "var(--ink-soft)",
            fontSize: "15px",
          }}
        >
          Decide per column what happens to strays. Inspect diffs before committing to the lineage log.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--white-70)",
            border: "1.5px solid var(--ink)",
            borderRadius: "var(--r-md)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          background: "var(--white-100)",
          border: "1px solid var(--white-50)",
          borderRadius: "var(--r-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-2)",
        }}
      >
        {/* Column & Detection Method */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Target Column
            </label>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
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
                outline: "none",
              }}
            >
              {quantCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} (quantitative · est. ~{c.outliers_estimate || 0} outliers)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Detector Method
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { id: "iqr", label: "IQR (Tukey)", sub: "Robust quartile spread" },
                { id: "zscore", label: "Z-Score", sub: "Standard deviations" },
                { id: "mad", label: "MAD (Modified Z)", sub: "Median absolute dev." },
                { id: "isolation_forest", label: "Isolation Forest", sub: "Tree partition" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDetectorMethod(m.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--r-sm)",
                    border: detectorMethod === m.id ? "1.5px solid var(--ink)" : "1px solid var(--white-50)",
                    background: detectorMethod === m.id ? "var(--white-80)" : "var(--white-90)",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: detectorMethod === m.id ? "var(--emboss)" : "none",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{m.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--ink-muted)", fontStyle: "italic" }}>{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detector Threshold Parameters */}
          <div style={{ display: "flex", gap: "12px" }}>
            {detectorMethod === "iqr" && (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", color: "var(--ink-muted)", display: "block", marginBottom: "4px" }}>
                  IQR Multiplier (k)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={iqrK}
                  onChange={(e) => setIqrK(parseFloat(e.target.value) || 1.5)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    background: "var(--white-70)",
                    border: "1px solid var(--white-40)",
                    borderRadius: "var(--r-sm)",
                    fontFamily: "var(--font-mono)",
                    boxShadow: "var(--deboss)",
                  }}
                />
              </div>
            )}

            {detectorMethod === "zscore" && (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", color: "var(--ink-muted)", display: "block", marginBottom: "4px" }}>
                  Z-Score Threshold (σ)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={zScoreThresh}
                  onChange={(e) => setZScoreThresh(parseFloat(e.target.value) || 3.0)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    background: "var(--white-70)",
                    border: "1px solid var(--white-40)",
                    borderRadius: "var(--r-sm)",
                    fontFamily: "var(--font-mono)",
                    boxShadow: "var(--deboss)",
                  }}
                />
              </div>
            )}

            {detectorMethod === "mad" && (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", color: "var(--ink-muted)", display: "block", marginBottom: "4px" }}>
                  Modified Z Threshold
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={madThresh}
                  onChange={(e) => setMadThresh(parseFloat(e.target.value) || 3.5)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    background: "var(--white-70)",
                    border: "1px solid var(--white-40)",
                    borderRadius: "var(--r-sm)",
                    fontFamily: "var(--font-mono)",
                    boxShadow: "var(--deboss)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Strategy & Grouping */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Action Strategy
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { id: "cap", label: "Cap (Winsorize)", desc: "Clamp to 1st-99th %tile" },
                { id: "drop", label: "Drop Rows", desc: "Excise stray records" },
                { id: "impute", label: "Impute", desc: "Replace with median/mean" },
                { id: "flag", label: "Flag Only", desc: "Add boolean indicator" },
              ].map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActionType(a.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--r-sm)",
                    border: actionType === a.id ? "1.5px solid var(--ink)" : "1px solid var(--white-50)",
                    background: actionType === a.id ? "var(--white-80)" : "var(--white-90)",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: actionType === a.id ? "var(--emboss)" : "none",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{a.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--ink-muted)", fontStyle: "italic" }}>{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {actionType === "impute" && (
            <div>
              <label style={{ fontSize: "11px", color: "var(--ink-muted)", display: "block", marginBottom: "4px" }}>
                Imputation Method
              </label>
              <select
                value={imputeStrategy}
                onChange={(e) => setImputeStrategy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  background: "var(--white-70)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              >
                <option value="median">Median (Recommended for skew)</option>
                <option value="mean">Mean</option>
                <option value="interpolate">Linear Interpolation</option>
              </select>
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Group-Aware Detection (Optional)
            </label>
            <select
              value={groupByCol}
              onChange={(e) => setGroupByCol(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--white-70)",
                border: "1px solid var(--white-40)",
                borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--ink)",
              }}
            >
              <option value="">None (Evaluate across entire dataset)</option>
              {nominalCols.map((c) => (
                <option key={c.name} value={c.name}>
                  Partition by {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
            <button
              onClick={handleDryRun}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "var(--white-80)",
                color: "var(--ink)",
                border: "1.5px solid var(--ink)",
                borderRadius: "var(--r-sm)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "var(--emboss)",
              }}
            >
              <Eye size={14} />
              <span>Dry-Run Preview</span>
            </button>

            <button
              onClick={handleApplyStep}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "var(--ink)",
                color: "var(--white-100)",
                border: "none",
                borderRadius: "var(--r-sm)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "var(--shadow-2)",
              }}
            >
              <Check size={14} />
              <span>Commit Step</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dry Run Preview with Hatched Outlier Rows */}
      {dryRunResult && (
        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-lg)",
            padding: "20px",
            boxShadow: "var(--shadow-3)",
          }}
        >
          {/* Diff Metric Summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "14px",
              borderBottom: "1px dashed var(--white-40)",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "var(--ink-muted)",
                }}
              >
                DRY-RUN INSPECTION RESULTS
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {dryRunResult.rows_affected} strays identified in '{dryRunResult.column}'
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--ink-soft)" }}>
                Rows: {dryRunResult.rows_before} → {dryRunResult.rows_after}
              </span>
              <span style={{ color: "var(--white-30)" }}>|</span>
              <span style={{ color: "var(--ink-muted)" }}>
                Hash: {dryRunResult.before_hash} → {dryRunResult.after_hash}
              </span>
            </div>
          </div>

          {/* Hatched Sample Table */}
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
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Status</th>
                  {profile?.columns.map((col) => (
                    <th key={col.name} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>
                      {col.name}
                    </th>
                  ))}
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Proposed Value</th>
                </tr>
              </thead>
              <tbody>
                {dryRunResult.preview_rows.map((row: any, idx: number) => {
                  const isOutlier = row._is_outlier;
                  return (
                    <tr
                      key={idx}
                      className={isOutlier ? "hatch-pattern" : ""}
                      style={{
                        borderBottom: "1px solid var(--white-50)",
                        background: isOutlier ? undefined : idx % 2 === 1 ? "var(--white-60)" : "var(--white-100)",
                        transition: "all var(--t-fast) var(--ease)",
                      }}
                    >
                      <td style={{ padding: "7px 10px", color: "var(--ink-muted)" }}>{idx + 1}</td>
                      <td style={{ padding: "7px 10px" }}>
                        {isOutlier ? (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              background: "var(--ink)",
                              color: "var(--white-100)",
                              borderRadius: "3px",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            STRAY
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-muted)", fontSize: "11px" }}>clean</span>
                        )}
                      </td>
                      {profile?.columns.map((col) => (
                        <td
                          key={col.name}
                          style={{
                            padding: "7px 10px",
                            fontWeight: col.name === selectedCol && isOutlier ? 700 : 400,
                            textDecoration: col.name === selectedCol && isOutlier ? "line-through" : "none",
                          }}
                        >
                          {String(row[col.name] ?? "<null>")}
                        </td>
                      ))}
                      <td style={{ padding: "7px 10px", fontWeight: 700, color: "var(--ink)" }}>
                        {row._proposed_value !== undefined ? (
                          <span style={{ background: "var(--white-100)", padding: "2px 6px", borderRadius: "3px" }}>
                            {String(row._proposed_value)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
