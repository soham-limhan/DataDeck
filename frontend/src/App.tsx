import React, { useEffect, useState } from "react";
import "./tokens.css";
import { Marquee } from "./components/Marquee";
import { StageRail } from "./components/StageRail";
import { CardStack } from "./components/CardStack";
import { Inspector } from "./components/Inspector";
import { ReportModal } from "./components/ReportModal";
import { IngestStage } from "./stages/IngestStage";
import { CleanseStage } from "./stages/CleanseStage";
import { ForecastStage } from "./stages/ForecastStage";
import { ComposeStage } from "./stages/ComposeStage";
import { DashboardStage } from "./stages/DashboardStage";
import { DatasetProfile, LineageEvent, ForecastResult, ColumnProfile, api } from "./api";

export const App: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [datasetName, setDatasetName] = useState<string>("sample_sales_deck.csv");
  const [lineageEvents, setLineageEvents] = useState<LineageEvent[]>([]);
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load active deck data on initial render
  useEffect(() => {
    loadDeckData();
  }, []);

  const loadDeckData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, previewRes, lineageRes] = await Promise.all([
        api.getDatasetProfile(),
        api.getDatasetPreview(100),
        api.getLineageLog(),
      ]);

      setProfile(profileRes.profile);
      setDatasetName(profileRes.dataset_name);
      setPreviewRows(previewRes.rows);
      setLineageEvents(lineageRes.events);

      if (!selectedColumnName && profileRes.profile.columns.length > 0) {
        setSelectedColumnName(profileRes.profile.columns[0].name);
      }
    } catch (err) {
      console.error("Failed to load deck data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetDeck();
      setForecastResult(null);
      await loadDeckData();
    } catch (err) {
      console.error("Failed to reset deck:", err);
    }
  };

  const handleUndo = async () => {
    try {
      await api.undoStep();
      await loadDeckData();
    } catch (err) {
      console.error("Failed to undo step:", err);
    }
  };

  const handleStepApplied = async () => {
    await loadDeckData();
  };

  const handleForecastCompleted = (res: ForecastResult) => {
    setForecastResult(res);
  };

  const selectedColObj: ColumnProfile | null =
    profile?.columns.find((c) => c.name === selectedColumnName) || null;

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--white-90)",
      }}
    >
      {/* Marquee Bar */}
      <div className="no-print">
        <Marquee
          datasetName={datasetName}
          rowCount={profile?.row_count || 0}
          checksum={profile?.checksum || "------"}
          lineageCount={lineageEvents.length}
          activeStage={activeStage}
          onReset={handleReset}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      </div>

      {/* Main Studio Body: StageRail + CardStack + Inspector */}
      <div className="no-print" style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Stage Rail Navigation */}
        <StageRail
          activeStage={activeStage}
          onSelectStage={setActiveStage}
          lineageCount={lineageEvents.length}
          hasForecast={forecastResult !== null}
        />

        {/* Center Workspace (Card Stack) */}
        <main
          style={{
            flex: 1,
            padding: "32px 36px",
            overflowY: "auto",
            maxWidth: "1240px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <CardStack activeStage={activeStage}>
            {activeStage === 0 && (
              <IngestStage
                profile={profile}
                previewRows={previewRows}
                onReload={loadDeckData}
                onSelectColumn={setSelectedColumnName}
                selectedColumnName={selectedColumnName}
              />
            )}

            {activeStage === 1 && (
              <CleanseStage
                profile={profile}
                onStepApplied={handleStepApplied}
              />
            )}

            {activeStage === 2 && (
              <ForecastStage
                profile={profile}
                forecastResult={forecastResult}
                onForecastCompleted={handleForecastCompleted}
              />
            )}

            {activeStage === 3 && (
              <ComposeStage
                onExport={() => setIsReportModalOpen(true)}
              />
            )}

            {activeStage === 4 && (
              <DashboardStage
                profile={profile}
                rawRows={previewRows}
                forecastResult={forecastResult}
                lineageEvents={lineageEvents}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            )}
          </CardStack>
        </main>

        {/* Right Inspector & Lineage Audit Log */}
        <Inspector
          lineageEvents={lineageEvents}
          selectedColumn={selectedColObj}
          onUndo={handleUndo}
          checksum={profile?.checksum || ""}
        />
      </div>

      {/* Customizable PDF Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        datasetName={datasetName}
        profile={profile}
        lineageEvents={lineageEvents}
        forecastResult={forecastResult}
      />
    </div>
  );
};

export default App;
