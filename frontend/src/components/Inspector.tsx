import React from "react";
import { History, Undo2, ChevronRight, Hash, Layers } from "lucide-react";
import { LineageEvent, ColumnProfile } from "../api";

interface InspectorProps {
  lineageEvents: LineageEvent[];
  selectedColumn: ColumnProfile | null;
  onUndo: () => void;
  checksum: string;
}

export const Inspector: React.FC<InspectorProps> = ({
  lineageEvents,
  selectedColumn,
  onUndo,
  checksum,
}) => {
  return (
    <aside
      style={{
        width: "320px",
        flexShrink: 0,
        background: "var(--white-80)",
        borderLeft: "1px solid var(--white-50)",
        padding: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxShadow: "var(--emboss)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px dashed var(--white-40)",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={15} color="var(--ink)" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink)",
            }}
          >
            LINEAGE AUDIT
          </span>
        </div>

        {lineageEvents.length > 0 && (
          <button
            onClick={onUndo}
            title="Undo the last transformation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              background: "var(--white-100)",
              border: "1px solid var(--white-40)",
              borderRadius: "var(--r-sm)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--ink)",
              cursor: "pointer",
              boxShadow: "var(--shadow-1)",
            }}
          >
            <Undo2 size={12} />
            <span>Undo Step</span>
          </button>
        )}
      </div>

      {/* Lineage Event Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            color: "var(--ink-muted)",
            fontFamily: "var(--font-accent)",
            fontStyle: "italic",
          }}
        >
          {lineageEvents.length === 0
            ? "No transformations applied yet. Dataset is in original dealt state."
            : `${lineageEvents.length} transformation(s) committed:`}
        </div>

        {lineageEvents.map((evt, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--white-100)",
              border: "1px solid var(--white-50)",
              borderRadius: "var(--r-md)",
              padding: "12px",
              boxShadow: "var(--shadow-1)",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--ink-muted)",
                }}
              >
                № {String(evt.step_index).padStart(2, "0")} · {evt.op.toUpperCase()}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  background: "var(--white-60)",
                  color: "var(--ink)",
                }}
              >
                {evt.action}
              </span>
            </div>

            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
              {evt.column}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "6px",
                fontSize: "11px",
                color: "var(--ink-soft)",
              }}
            >
              <span>{evt.rows_affected} rows changed</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--ink-muted)",
                }}
              >
                {evt.before_hash} → {evt.after_hash}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Column Details Inspector */}
      {selectedColumn && (
        <div
          style={{
            marginTop: "auto",
            background: "var(--white-70)",
            border: "1px solid var(--white-40)",
            borderRadius: "var(--r-md)",
            padding: "14px",
            boxShadow: "var(--deboss)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--ink-muted)",
              }}
            >
              COLUMN PROFILE
            </span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                padding: "2px 6px",
                borderRadius: "var(--r-sm)",
                background: "var(--white-100)",
                border: "1px solid var(--white-40)",
              }}
            >
              {selectedColumn.type}
            </span>
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: "8px",
            }}
          >
            {selectedColumn.name}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div>Nulls: {selectedColumn.null_count} ({selectedColumn.null_pct}%)</div>
            <div>Unique: {selectedColumn.unique_count}</div>
            {selectedColumn.mean !== undefined && (
              <>
                <div>Mean: {selectedColumn.mean}</div>
                <div>Median: {selectedColumn.median}</div>
                <div>Min: {selectedColumn.min}</div>
                <div>Max: {selectedColumn.max}</div>
                <div>Est. Outliers: {selectedColumn.outliers_estimate}</div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
