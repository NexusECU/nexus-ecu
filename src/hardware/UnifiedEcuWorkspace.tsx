import {
  Activity,
  Archive,
  BarChart3,
  ClipboardCheck,
  Cpu,
  FileSearch,
  Grid3X3,
  History,
  ShieldCheck,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import type {
  RomImageInfo,
} from "../rom/romTypes";

import {
  LiveDiagnosticDashboard,
} from "./LiveDiagnosticDashboard";

import {
  VehicleEcuDetectionWorkspace,
} from "./VehicleEcuDetectionWorkspace";

import {
  HardwareDiagnosticsPanel,
} from "./HardwareDiagnosticsPanel";

import {
  EcuReadBackupPanel,
} from "./EcuReadBackupPanel";

import {
  EcuCapabilityMatrixPanel,
} from "./EcuCapabilityMatrixPanel";

import {
  EcuSessionManager,
} from "./EcuSessionManager";

import {
  EcuSessionLifecyclePanel,
} from "./EcuSessionLifecyclePanel";

import {
  EcuIdentificationPanel,
} from "./EcuIdentificationPanel";

import {
  GuidedVehicleConnectionFlow,
} from "./GuidedVehicleConnectionFlow";

import {
  LiveIdentificationPipelinePanel,
} from "./LiveIdentificationPipelinePanel";

import {
  decodeLiveEcuIdentification,
} from "./liveEcuIdentificationService";

import "./unified-ecu-workspace.css";
import "./guided-vehicle-connection-flow.css";
import "./live-identification-pipeline.css";
import "./ecu-session-lifecycle.css";

type WorkspaceTab =
  | "overview"
  | "identification"
  | "live"
  | "diagnostics"
  | "read-backup"
  | "capabilities"
  | "session";

type Props = {
  providerId:
    TransportProviderId;

  initialTab?:
    WorkspaceTab;

  onTabChange?: (
    tab:
      WorkspaceTab,
  ) => void;

  connection:
    HardwareConnectionInfo;

  frames:
    CanFrame[];

  adapterDetected:
    boolean;

  canMonitorActive:
    boolean;

  bitrateKbps:
    number | null;

  lastActivityMs:
    number | null;

  lastError:
    string | null;

  loadedRomImage:
    RomImageInfo | null;
};

const tabs: Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "overview",
    label: "Overview",
    icon: <Cpu size={12}/>,
  },
  {
    id: "identification",
    label: "Identification",
    icon: <FileSearch size={12}/>,
  },
  {
    id: "live",
    label: "Live Data",
    icon: <Activity size={12}/>,
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    icon: <ClipboardCheck size={12}/>,
  },
  {
    id: "read-backup",
    label: "Read / Backup",
    icon: <Archive size={12}/>,
  },
  {
    id: "capabilities",
    label: "Capabilities",
    icon: <Grid3X3 size={12}/>,
  },
  {
    id: "session",
    label: "Session Log",
    icon: <History size={12}/>,
  },
];

export function UnifiedEcuWorkspace({
  providerId,
  connection,
  frames,
  adapterDetected,
  canMonitorActive,
  bitrateKbps,
  lastActivityMs,
  lastError,
  loadedRomImage,
  initialTab = "overview",
  onTabChange,
}: Props) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<WorkspaceTab>(
    initialTab,
  );

  const diagnosticResponderReady =
    frames.some(
      frame =>
        frame.id >= 0x7e8 &&
        frame.id <= 0x7ef,
    );

  const liveIdentification =
    decodeLiveEcuIdentification(
      frames,
    );

  const vin =
    liveIdentification.identity.vin;

  const calibrationIds =
    liveIdentification.identity.calibrationIds;

  const cvns =
    liveIdentification.identity.cvns;

  const ecuNames =
    liveIdentification.identity.ecuNames;

  const identityReady =
    Boolean(
      vin ||
      calibrationIds.length ||
      ecuNames.length ||
      cvns.length,
    );

  return (
    <section className="unified-ecu-workspace">
      <div className="unified-ecu-header">
        <div>
          <Cpu size={17}/>

          <div>
            <span className="eyebrow">
              UNIFIED ECU WORKSPACE · V8.0
            </span>

            <h2>
              NEXUS ECU Workspace
            </h2>
          </div>
        </div>

        <div className="unified-ecu-safety">
          <ShieldCheck size={13}/>
          READ-ONLY HARDWARE MODE
        </div>
      </div>

      <div className="unified-ecu-statusbar">
        <Status
          label="PROVIDER"
          value={providerId.toUpperCase()}
        />

        <Status
          label="ADAPTER"
          value={
            adapterDetected
              ? "DETECTED"
              : "NOT DETECTED"
          }
        />

        <Status
          label="LINK"
          value={
            connection.connected
              ? "CONNECTED"
              : "NONE"
          }
        />

        <Status
          label="CAN"
          value={
            canMonitorActive
              ? "ACTIVE"
              : "INACTIVE"
          }
        />

        <Status
          label="FRAMES"
          value={
            frames.length.toLocaleString()
          }
        />

        <Status
          label="ROM"
          value={
            loadedRomImage
              ? loadedRomImage.fileName
              : "NONE"
          }
        />
      </div>

      <div className="unified-ecu-tabs">
        {tabs.map(
          tab => (
            <button
              type="button"
              key={tab.id}
              className={
                activeTab === tab.id
                  ? "active"
                  : ""
              }
              onClick={() => {
                setActiveTab(
                  tab.id,
                );

                onTabChange?.(
                  tab.id,
                );
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ),
        )}
      </div>

      <div className="unified-ecu-content">
        {activeTab === "overview" && (
          <div className="unified-ecu-overview-grid">
            <GuidedVehicleConnectionFlow
              adapterDetected={
                adapterDetected
              }
              linkConnected={
                connection.connected
              }
              canMonitorActive={
                canMonitorActive
              }
              framesObserved={
                frames.length
              }
              diagnosticResponderReady={
                diagnosticResponderReady
              }
              identityReady={
                identityReady
              }
              onOpenIdentification={() => {
                setActiveTab(
                  "identification",
                );
                onTabChange?.(
                  "identification",
                );
              }}
              onOpenDiagnostics={() => {
                setActiveTab(
                  "diagnostics",
                );
                onTabChange?.(
                  "diagnostics",
                );
              }}
              onOpenSession={() => {
                setActiveTab(
                  "session",
                );
                onTabChange?.(
                  "session",
                );
              }}
            />

            <LiveDiagnosticDashboard
              connection={connection}
              frames={frames}
              adapterDetected={adapterDetected}
              canMonitorActive={canMonitorActive}
              bitrateKbps={bitrateKbps}
              vin={vin}
              calibrationIds={calibrationIds}
              lastError={lastError}
              lastActivityMs={lastActivityMs}
            />

            <VehicleEcuDetectionWorkspace
              frames={frames}
              vin={vin}
              calibrationIds={calibrationIds}
              cvns={cvns}
              ecuNames={ecuNames}
              bitrateKbps={bitrateKbps}
            />
          </div>
        )}

        {activeTab === "identification" && (
          <div className="unified-identification-stack">
            <LiveIdentificationPipelinePanel
              frames={
                frames
              }
            />

            <EcuIdentificationPanel
              adapterDetected={adapterDetected}
              linkConnected={connection.connected}
            />
          </div>
        )}

        {activeTab === "live" && (
          <LiveDiagnosticDashboard
            connection={connection}
            frames={frames}
            adapterDetected={adapterDetected}
            canMonitorActive={canMonitorActive}
            bitrateKbps={bitrateKbps}
            vin={vin}
            calibrationIds={calibrationIds}
            lastError={lastError}
            lastActivityMs={lastActivityMs}
          />
        )}

        {activeTab === "diagnostics" && (
          <HardwareDiagnosticsPanel
            connection={connection}
            frames={frames}
            adapterDetected={adapterDetected}
            canMonitorActive={canMonitorActive}
            bitrateKbps={bitrateKbps}
            vin={vin}
            calibrationIds={calibrationIds}
            lastError={lastError}
          />
        )}

        {activeTab === "read-backup" && (
          <EcuReadBackupPanel
            providerId={providerId}
            adapterDetected={adapterDetected}
            linkConnected={connection.connected}
            identitySummary={
              connection.connected
                ? "READ-ONLY SESSION READY / ECU IDENTITY NOT ACTIVELY REQUESTED"
                : "UNKNOWN"
            }
            protocolSummary={
              frames.length
                ? `${frames.length} CAN FRAME(S) OBSERVED`
                : "UNKNOWN"
            }
            loadedRomImage={loadedRomImage}
          />
        )}

        {activeTab === "capabilities" && (
          <EcuCapabilityMatrixPanel
            providerId={providerId}
            adapterReady={adapterDetected}
            linkReady={connection.connected}
            diagnosticResponderReady={diagnosticResponderReady}
            identityReady={identityReady}
            romImageLoaded={Boolean(loadedRomImage)}
          />
        )}

        {activeTab === "session" && (
          <div className="unified-session-stack">
            <EcuSessionLifecyclePanel
              transportConnected={
                connection.connected
              }
              ecuResponderDetected={
                diagnosticResponderReady
              }
              identityConfirmed={
                identityReady
              }
              lastActivityMs={
                lastActivityMs
              }
              error={
                lastError
              }
            />

            <EcuSessionManager
              frames={frames}
              adapterReady={adapterDetected}
              linkReady={connection.connected}
              bitrateKbps={bitrateKbps}
              vin={vin}
              calibrationIds={calibrationIds}
            />
          </div>
        )}
      </div>

      <div className="unified-ecu-footer">
        <BarChart3 size={12}/>
        v8.0 consolidates ECU workflow presentation only.
        Existing provider/session safety gates remain unchanged.
      </div>
    </section>
  );
}

function Status({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
