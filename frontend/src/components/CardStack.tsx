import React from "react";

interface CardStackProps {
  activeStage: number;
  children: React.ReactNode;
}

export const CardStack: React.FC<CardStackProps> = ({ activeStage, children }) => {
  const cards = [
    { title: "Stage ①: Ingest", rotation: "-1.2deg", offset: "8px" },
    { title: "Stage ②: Cleanse", rotation: "1.0deg", offset: "14px" },
    { title: "Stage ③: Forecast", rotation: "-0.8deg", offset: "20px" },
    { title: "Stage ④: Compose", rotation: "1.2deg", offset: "26px" },
  ];

  return (
    <div style={{ position: "relative", minHeight: "680px" }}>
      {/* Background Fanned Deck Layers */}
      {cards.map((card, idx) => {
        if (idx >= activeStage) return null;
        return (
          <div
            key={card.title}
            style={{
              position: "absolute",
              top: `${(idx + 1) * -6}px`,
              left: `${(idx + 1) * 4}px`,
              right: `${(idx + 1) * 4}px`,
              height: "100%",
              background: "var(--white-80)",
              border: "1px solid var(--white-50)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-1)",
              transform: `rotate(${card.rotation})`,
              pointerEvents: "none",
              zIndex: idx,
              opacity: 0.65,
            }}
          />
        );
      })}

      {/* Active Top Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "var(--white-90)",
          borderRadius: "var(--r-lg)",
          transition: "transform var(--t-base) var(--ease)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
