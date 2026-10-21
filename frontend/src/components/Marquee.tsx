import React from "react";
import { Download, RotateCcw, Database, ShieldCheck, FileText } from "lucide-react";
import { api } from "../api";

interface MarqueeProps {
  datasetName: string;
  rowCount: number;
  checksum: string;
  lineageCount: number;
  activeStage: number;
  onReset: () => void;
  onOpenReportModal?: () => void;
}

export const Marquee: React.FC<MarqueeProps> = ({
  datasetName,
  rowCount,
  checksum,
  lineageCount,
  activeStage,
  onReset,
  onOpenReportModal,
}) => {
  const stageLabels = ["Ingest", "Cleanse", "Forecast", "Compose", "Dashboard"];
  const currentStageName = stageLabels[activeStage] || "Ingest";

  const getStatusStamp = () => {
    if (lineageCount > 0) {
      return `CLEANSED · ${lineageCount} STEPS`;
    }
    return "DEAL ACTIVE";
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        background: "var(--white-100)",
        borderBottom: "1px solid var(--white-50)",
        boxShadow: "var(--shadow-1)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Project Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            border: "1.5px solid var(--ink)",
            borderRadius: "var(--r-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--white-80)",
            boxShadow: "var(--emboss)",
          }}
        >
          <span style={{ fontSize: "18px", color: "var(--ink)" }}>❖</span>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--ink)",
              }}
            >
              DATADECK
            </h1>
            <span
              style={{
                fontFamily: "var(--font-accent)",
                fontStyle: "italic",
                color: "var(--ink-soft)",
                fontSize: "14px",
              }}
            >
              Ingest. Cleanse. Forecast. Compose.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--ink-muted)",
              marginTop: "2px",
            }}
          >
            <span>Stage:</span>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>
              {currentStageName}
            </span>
            <span>·</span>
            <span>Ref: {datasetName}</span>
          </div>
        </div>
      </div>

      {/* Status Seal & Dataset Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Status Stamp */}
        <div className="stamp-seal">
          <ShieldCheck size={13} strokeWidth={2.2} />
          <span>{getStatusStamp()}</span>
        </div>

        {/* Dataset Metadata Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 14px",
            background: "var(--white-70)",
            border: "1px solid var(--white-40)",
            borderRadius: "var(--r-full)",
            boxShadow: "var(--deboss)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
          }}
        >
          <Database size={13} color="var(--ink-soft)" />
          <span style={{ fontWeight: 600 }}>{rowCount} rows</span>
          <span style={{ color: "var(--white-30)" }}>|</span>
          <span style={{ color: "var(--ink-muted)" }}>Hash #{checksum}</span>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
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
              <FileText size={13} />
              <span>PDF Report</span>
            </button>
          )}

          <a
            href={api.getDownloadUrl()}
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              background: "var(--white-100)",
              border: "1px solid var(--white-50)",
              borderRadius: "var(--r-sm)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--ink)",
              textDecoration: "none",
              boxShadow: "var(--emboss)",
              cursor: "pointer",
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </a>

          <button
            onClick={onReset}
            title="Reset deck to original deal"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              background: "transparent",
              border: "1px solid var(--white-50)",
              borderRadius: "var(--r-sm)",
              fontSize: "12px",
              color: "var(--ink-soft)",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
