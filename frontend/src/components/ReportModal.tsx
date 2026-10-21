import React, { useState } from "react";
import { Printer, Download, X, CheckSquare, Square, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { DatasetProfile, ForecastResult, LineageEvent } from "../api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  profile: DatasetProfile | null;
  lineageEvents: LineageEvent[];
  forecastResult: ForecastResult | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  datasetName,
  profile,
  lineageEvents,
  forecastResult,
}) => {
  if (!isOpen) return null;

  // Customization State
  const [reportTitle, setReportTitle] = useState("DataDeck Pipeline & Quality Audit Report");
  const [auditorName, setAuditorName] = useState("Bureau of Data Integrity & Forecasting");
  const [reportId] = useState(`REP-${profile?.checksum || "8F21"}-2026`);
  const [reportDate] = useState(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  const [customNotes, setCustomNotes] = useState(
    "Every transformation within this pipeline was verified against deterministic checksums. Outliers were detected and remediated via user-chosen parameters without silent data loss."
  );

  // Section Toggles
  const [incSummary, setIncSummary] = useState(true);
  const [incLineage, setIncLineage] = useState(true);
  const [incForecast, setIncForecast] = useState(true);
  const [incNotes, setIncNotes] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const el = document.getElementById("printable-report");
    if (!el) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #FAF9F5; color: #1C1B18; padding: 40px; margin: 0; line-height: 1.5; }
    h1, h2, h3 { font-family: 'Fraunces', serif; }
    table { width: 100%; border-collapse: collapse; font-family: 'JetBrains Mono', monospace; font-size: 11px; margin: 16px 0; }
    th, td { border-bottom: 1px solid #E8E4D9; padding: 8px 10px; text-align: left; }
    th { background: #F5F3EC; }
    .divider { text-align: center; margin: 32px 0; color: #7A7568; font-family: 'Fraunces', serif; }
    .stamp { display: inline-block; padding: 4px 10px; border: 1.5px dashed #1C1B18; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; transform: rotate(-3deg); }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DataDeck_Report_${reportId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="report-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(28, 27, 24, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        className="report-modal-dialog"
        style={{
          width: "100%",
          maxWidth: "1050px",
          maxHeight: "92vh",
          background: "var(--white-90)",
          border: "1.5px solid var(--white-40)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Top Bar */}
        <div
          className="report-modal-header no-print"
          style={{
            padding: "16px 24px",
            background: "var(--white-100)",
            borderBottom: "1px solid var(--white-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={18} color="var(--ink)" />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--ink)" }}>
              CUSTOMISE & EXPORT PDF REPORT
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
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
              <Printer size={13} />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "var(--white-80)",
                color: "var(--ink)",
                border: "1px solid var(--white-50)",
                borderRadius: "var(--r-sm)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              <span>HTML File</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "var(--ink-soft)",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Customizer Sidebar + Document Preview */}
        <div className="report-modal-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Customizer Sidebar */}
          <div
            className="report-modal-sidebar no-print"
            style={{
              width: "320px",
              flexShrink: 0,
              background: "var(--white-80)",
              borderRight: "1px solid var(--white-50)",
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
                REPORT TITLE
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  background: "var(--white-70)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
                AUDITOR / INSTITUTION
              </label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  background: "var(--white-70)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              />
            </div>

            {/* Section Inclusions */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "8px" }}>
                SECTION INCLUSIONS
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "Executive Ingestion Overview", state: incSummary, set: setIncSummary },
                  { label: "Lineage Log & Diff Hashes", state: incLineage, set: setIncLineage },
                  { label: "Forecast Metrics & Projection", state: incForecast, set: setIncForecast },
                  { label: "Auditor Remarks & Notes", state: incNotes, set: setIncNotes },
                ].map((sec) => (
                  <button
                    key={sec.label}
                    onClick={() => sec.set(!sec.state)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "12px",
                      color: "var(--ink)",
                    }}
                  >
                    {sec.state ? <CheckSquare size={14} color="var(--ink)" /> : <Square size={14} color="var(--white-40)" />}
                    <span>{sec.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "4px" }}>
                AUDITOR REMARKS / METHODOLOGY
              </label>
              <textarea
                rows={4}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "var(--white-70)",
                  border: "1px solid var(--white-40)",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Printable Report Preview */}
          <div
            className="report-modal-preview"
            style={{
              flex: 1,
              padding: "36px 44px",
              background: "var(--white-100)",
              overflowY: "auto",
            }}
          >
            <div
              id="printable-report"
              className="printable-report"
              style={{
                maxWidth: "760px",
                margin: "0 auto",
                background: "var(--white-100)",
                color: "var(--ink)",
              }}
            >
              {/* Report Document Header */}
              <div
                className="report-section report-header-block"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  borderBottom: "2px solid var(--ink)",
                  paddingBottom: "16px",
                  marginBottom: "28px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--ink-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    ▫ DATADECK AUDIT DOSSIER ▫
                  </div>
                  <h1
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "26px",
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {reportTitle}
                  </h1>
                  <div
                    style={{
                      fontFamily: "var(--font-accent)",
                      fontStyle: "italic",
                      fontSize: "14px",
                      color: "var(--ink-soft)",
                      marginTop: "2px",
                    }}
                  >
                    Prepared by: {auditorName} · Date: {reportDate}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="stamp" style={{ border: "1.5px dashed var(--ink)", padding: "4px 8px", fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    SEAL: VERIFIED
                  </div>
                  <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-muted)", marginTop: "6px" }}>
                    № {reportId}
                  </div>
                </div>
              </div>

              {/* Ingestion & Schema Summary */}
              {incSummary && profile && (
                <div className="report-section" style={{ marginBottom: "28px" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      borderBottom: "1px dashed var(--white-40)",
                      paddingBottom: "4px",
                    }}
                  >
                    § 01 · Ingestion & Schema Inventory
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "12px" }}>
                    Source file <strong>{datasetName}</strong> verified with checksum <code>#{profile.checksum}</code>.
                    Total observed volume: {profile.row_count} rows across {profile.column_count} columns.
                  </p>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      marginBottom: "16px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "var(--white-70)", borderBottom: "1px solid var(--white-40)" }}>
                        <th style={{ padding: "6px 8px" }}>Field Name</th>
                        <th style={{ padding: "6px 8px" }}>Inferred Type</th>
                        <th style={{ padding: "6px 8px" }}>Nulls</th>
                        <th style={{ padding: "6px 8px" }}>Unique</th>
                        <th style={{ padding: "6px 8px" }}>Mean / Distinct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.columns.map((c, i) => (
                        <tr key={c.name} style={{ borderBottom: "1px solid var(--white-50)", background: i % 2 === 1 ? "var(--white-60)" : "transparent" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: "6px 8px" }}>{c.type}</td>
                          <td style={{ padding: "6px 8px" }}>{c.null_count} ({c.null_pct}%)</td>
                          <td style={{ padding: "6px 8px" }}>{c.unique_count}</td>
                          <td style={{ padding: "6px 8px" }}>{c.mean !== undefined ? `μ = ${c.mean}` : `${c.unique_count} distinct`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lineage & Cleansing Audit Log */}
              {incLineage && (
                <div className="report-section" style={{ marginBottom: "28px" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      borderBottom: "1px dashed var(--white-40)",
                      paddingBottom: "4px",
                    }}
                  >
                    § 02 · Cleansing Actions & Lineage Audit Log
                  </h3>
                  {lineageEvents.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontStyle: "italic" }}>
                      No transformations were applied; data was certified in its natural state.
                    </p>
                  ) : (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "var(--white-70)", borderBottom: "1px solid var(--white-40)" }}>
                          <th style={{ padding: "6px 8px" }}>Step</th>
                          <th style={{ padding: "6px 8px" }}>Operation</th>
                          <th style={{ padding: "6px 8px" }}>Column</th>
                          <th style={{ padding: "6px 8px" }}>Action</th>
                          <th style={{ padding: "6px 8px" }}>Rows Affected</th>
                          <th style={{ padding: "6px 8px" }}>Hash Transition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineageEvents.map((evt) => (
                          <tr key={evt.step_index} style={{ borderBottom: "1px solid var(--white-50)" }}>
                            <td style={{ padding: "6px 8px" }}>№ {evt.step_index}</td>
                            <td style={{ padding: "6px 8px", textTransform: "uppercase" }}>{evt.op}</td>
                            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{evt.column}</td>
                            <td style={{ padding: "6px 8px" }}>{evt.action}</td>
                            <td style={{ padding: "6px 8px" }}>{evt.rows_affected}</td>
                            <td style={{ padding: "6px 8px" }}>{evt.before_hash} → {evt.after_hash}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Forecasting Section */}
              {incForecast && forecastResult && (
                <div className="report-section" style={{ marginBottom: "28px" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      borderBottom: "1px dashed var(--white-40)",
                      paddingBottom: "4px",
                    }}
                  >
                    § 03 · Predictive Modeling & Confidence Intervals
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                      background: "var(--white-70)",
                      padding: "12px",
                      borderRadius: "var(--r-sm)",
                      marginBottom: "12px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                    }}
                  >
                    <div>MAE Error: <strong>{forecastResult.metrics.mae ?? "—"}</strong></div>
                    <div>RMSE Error: <strong>{forecastResult.metrics.rmse ?? "—"}</strong></div>
                    <div>MAPE: <strong>{forecastResult.metrics.mape ?? "—"}%</strong></div>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                    Target metric <strong>{forecastResult.target_column}</strong> was fitted using model architecture <strong>{forecastResult.model}</strong> over a {forecastResult.horizon}-step forward horizon.
                  </p>
                </div>
              )}

              {/* Auditor Remarks */}
              {incNotes && customNotes && (
                <div className="report-section" style={{ marginBottom: "28px" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      borderBottom: "1px dashed var(--white-40)",
                      paddingBottom: "4px",
                    }}
                  >
                    § 04 · Methodology & Auditor Remarks
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      lineHeight: 1.6,
                      color: "var(--ink)",
                      background: "var(--white-80)",
                      padding: "12px 16px",
                      borderLeft: "3px solid var(--ink)",
                      fontFamily: "var(--font-accent)",
                      fontStyle: "italic",
                    }}
                  >
                    "{customNotes}"
                  </p>
                </div>
              )}

              {/* Footer */}
              <div
                className="report-section report-footer-block"
                style={{
                  textAlign: "center",
                  borderTop: "1px solid var(--white-40)",
                  paddingTop: "20px",
                  marginTop: "36px",
                  fontSize: "11px",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <div>──── ❖ ────</div>
                <div style={{ marginTop: "6px" }}>
                  DATADECK STUDIO · EVERY TRANSFORMATION VISIBLE, REVERSIBLE, AND YOURS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
