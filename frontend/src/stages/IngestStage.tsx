import React, { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Sparkles, Check, Database, AlertCircle } from "lucide-react";
import { DatasetProfile, api } from "../api";

interface IngestStageProps {
  profile: DatasetProfile | null;
  previewRows: any[];
  onReload: () => void;
  onSelectColumn: (colName: string) => void;
  selectedColumnName: string | null;
}

export const IngestStage: React.FC<IngestStageProps> = ({
  profile,
  previewRows,
  onReload,
  onSelectColumn,
  selectedColumnName,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      await api.uploadFile(file);
      onReload();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deal in file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDealSample = async () => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      await api.dealSample();
      onReload();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deal sample deck");
    } finally {
      setIsUploading(false);
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
          CARD ① · INGESTION & SCHEMA RECOGNITION
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            color: "var(--ink)",
            fontWeight: 700,
          }}
        >
          Deal in your data.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontStyle: "italic",
            color: "var(--ink-soft)",
            fontSize: "15px",
          }}
        >
          Drop any CSV, JSON, or XLSX. Schema and types are inferred automatically.
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
            color: "var(--ink)",
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dealer Dropzone & Sample Trigger */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "18px",
        }}
      >
        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--white-40)",
            borderRadius: "var(--r-lg)",
            padding: "32px 20px",
            textAlign: "center",
            background: "var(--white-80)",
            cursor: "pointer",
            boxShadow: "var(--deboss)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all var(--t-fast) var(--ease)",
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.json,.xlsx"
            style={{ display: "none" }}
          />
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--white-100)",
              border: "1px solid var(--white-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--emboss)",
            }}
          >
            <Upload size={18} color="var(--ink)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
              {isUploading ? "Shuffling the deck..." : "Deal a fresh file onto the table"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "2px" }}>
              Accepts CSV · JSON · XLSX
            </div>
          </div>
        </div>

        {/* Curated Sample Deck Card */}
        <div
          style={{
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-lg)",
            padding: "24px 20px",
            background: "var(--white-100)",
            boxShadow: "var(--shadow-2)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--ink-muted)",
                marginBottom: "6px",
              }}
            >
              PRE-LOADED DEMO
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              Curated Sales Deck
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--ink-soft)",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              365 daily transactions with deliberate typos, seasonal curves, and outlier strays.
            </p>
          </div>

          <button
            onClick={handleDealSample}
            disabled={isUploading}
            style={{
              marginTop: "16px",
              padding: "9px 14px",
              background: "var(--ink)",
              color: "var(--white-100)",
              border: "none",
              borderRadius: "var(--r-sm)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "var(--shadow-2)",
            }}
          >
            <Sparkles size={13} />
            <span>Deal Sample Deck</span>
          </button>
        </div>
      </div>

      {/* Schema Card Collection */}
      {profile && (
        <div>
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
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink)",
              }}
            >
              INFERRED SCHEMA · {profile.column_count} COLUMNS
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
              Select a column card to inspect
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "12px",
            }}
          >
            {profile.columns.map((col) => {
              const isSelected = selectedColumnName === col.name;
              return (
                <div
                  key={col.name}
                  onClick={() => onSelectColumn(col.name)}
                  style={{
                    background: isSelected ? "var(--white-100)" : "var(--white-80)",
                    border: isSelected
                      ? "1.5px solid var(--ink)"
                      : "1px solid var(--white-50)",
                    borderRadius: "var(--r-md)",
                    padding: "14px",
                    boxShadow: isSelected ? "var(--shadow-2)" : "var(--shadow-1)",
                    cursor: "pointer",
                    transition: "all var(--t-fast) var(--ease)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        background: "var(--white-60)",
                        color: "var(--ink)",
                        textTransform: "uppercase",
                      }}
                    >
                      {col.type}
                    </span>
                    {col.null_count > 0 && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink-muted)",
                        }}
                      >
                        {col.null_count} nulls
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBottom: "4px",
                    }}
                  >
                    {col.name}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--ink-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {col.type === "quantitative" && col.mean !== undefined ? (
                      <>
                        μ={col.mean} · med={col.median}
                        {col.outliers_estimate ? (
                          <div style={{ color: "var(--ink)", fontWeight: 600, marginTop: "2px" }}>
                            ~{col.outliers_estimate} outliers
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>{col.unique_count} distinct values</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Raw Data Table Preview */}
      {previewRows.length > 0 && (
        <div
          style={{
            background: "var(--white-100)",
            border: "1px solid var(--white-50)",
            borderRadius: "var(--r-lg)",
            padding: "18px",
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
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink)",
              }}
            >
              RAW TABLE SAMPLE (FIRST {previewRows.length} ROWS)
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
              Tabular numerals active
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
                  <th style={{ padding: "8px 10px", textAlign: "left", width: "40px", color: "var(--ink-muted)" }}>#</th>
                  {profile?.columns.map((col) => (
                    <th key={col.name} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 15).map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--white-50)",
                      background: idx % 2 === 1 ? "var(--white-60)" : "var(--white-100)",
                    }}
                  >
                    <td style={{ padding: "7px 10px", color: "var(--ink-muted)" }}>{idx + 1}</td>
                    {profile?.columns.map((col) => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined;
                      return (
                        <td
                          key={col.name}
                          style={{
                            padding: "7px 10px",
                            color: isNull ? "var(--ink-muted)" : "var(--ink)",
                            fontStyle: isNull ? "italic" : "normal",
                          }}
                        >
                          {isNull ? "<null>" : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
