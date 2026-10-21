import React from "react";
import { Database, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

interface StageRailProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
  lineageCount: number;
  hasForecast: boolean;
}

export const StageRail: React.FC<StageRailProps> = ({
  activeStage,
  onSelectStage,
  lineageCount,
  hasForecast,
}) => {
  const stages = [
    {
      num: "①",
      label: "Ingest",
      sub: "Deal in data",
      icon: Database,
      badge: "Loaded",
    },
    {
      num: "②",
      label: "Cleanse",
      sub: "Detect & adjust",
      icon: Sparkles,
      badge: lineageCount > 0 ? `${lineageCount} ops` : null,
    },
    {
      num: "③",
      label: "Forecast",
      sub: "Project flow",
      icon: TrendingUp,
      badge: hasForecast ? "Trained" : null,
    },
    {
      num: "④",
      label: "Compose",
      sub: "Chart visualizer",
      icon: BarChart3,
      badge: "Specs",
    },
    {
      num: "⑤",
      label: "Dashboard",
      sub: "Interactive filter grid",
      icon: BarChart3,
      badge: "Live",
    },
  ];

  return (
    <nav
      style={{
        width: "220px",
        flexShrink: 0,
        background: "var(--white-80)",
        borderRight: "1px solid var(--white-50)",
        padding: "24px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "var(--emboss)",
      }}
    >
      <div
        style={{
          padding: "0 10px 10px 10px",
          borderBottom: "1px dashed var(--white-40)",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
          }}
        >
          ❖ STAGE RAIL
        </div>
      </div>

      {stages.map((stage, idx) => {
        const isActive = activeStage === idx;
        const Icon = stage.icon;

        return (
          <button
            key={stage.label}
            onClick={() => onSelectStage(idx)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              border: isActive
                ? "1.5px solid var(--ink)"
                : "1px solid var(--white-50)",
              background: isActive ? "var(--white-100)" : "var(--white-90)",
              boxShadow: isActive ? "var(--shadow-2)" : "none",
              cursor: "pointer",
              textAlign: "left",
              position: "relative",
              transition: "all var(--t-fast) var(--ease)",
            }}
          >
            {/* Number Glyph */}
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "18px",
                color: isActive ? "var(--ink)" : "var(--ink-soft)",
                lineHeight: 1,
              }}
            >
              {stage.num}
            </span>

            {/* Label & Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 500,
                    color: "var(--ink)",
                  }}
                >
                  {stage.label}
                </span>

                {stage.badge && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: "var(--r-sm)",
                      background: isActive ? "var(--ink)" : "var(--white-60)",
                      color: isActive ? "var(--white-100)" : "var(--ink-soft)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {stage.badge}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-accent)",
                  fontStyle: "italic",
                }}
              >
                {stage.sub}
              </div>
            </div>

            {/* Active Marker */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  right: "-13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "0",
                  height: "0",
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderLeft: "6px solid var(--ink)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
