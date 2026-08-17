import {
  Activity,
  Database,
  FolderOpen,
  Gauge,
  Radio,
  ShieldCheck,
} from "lucide-react";

import type {
  NexusHeaderWorkspace,
} from "./DesktopShell";

import "./v10-dashboard.css";

type Props = {
  projectName:
    string;

  projectSaved:
    boolean;

  liveMode:
    boolean;

  engineRunning:
    boolean;

  romLoaded:
    boolean;

  logging:
    boolean;

  logSamples:
    number;

  activeWorkspace:
    NexusHeaderWorkspace;

  simplifiedMode:
    boolean;
};

export function NexusGlobalStatusBar({
  projectName,
  projectSaved,
  liveMode,
  engineRunning,
  romLoaded,
  logging,
  logSamples,
  activeWorkspace,
  simplifiedMode,
}: Props) {
  return (
    <div className="nexus-global-status">
      <StatusItem
        icon={
          <FolderOpen
            size={12}
          />
        }
        label="PROJECT"
        value={
          projectName ||
          "Untitled Project"
        }
        tone={
          projectSaved
            ? "good"
            : "warn"
        }
      />

      <StatusItem
        icon={
          <Radio
            size={12}
          />
        }
        label="ENVIRONMENT"
        value={
          liveMode
            ? "LIVE ECU"
            : "SIMULATOR"
        }
        tone={
          liveMode
            ? "good"
            : "neutral"
        }
      />

      <StatusItem
        icon={
          <Activity
            size={12}
          />
        }
        label="ENGINE"
        value={
          engineRunning
            ? "RUNNING"
            : "STOPPED"
        }
        tone={
          engineRunning
            ? "good"
            : "neutral"
        }
      />

      <StatusItem
        icon={
          <Database
            size={12}
          />
        }
        label="ROM"
        value={
          romLoaded
            ? "LOADED"
            : "NONE"
        }
        tone={
          romLoaded
            ? "good"
            : "neutral"
        }
      />

      <StatusItem
        icon={
          <Gauge
            size={12}
          />
        }
        label="LOGGING"
        value={
          logging
            ? "RECORDING"
            : logSamples >
                0
              ? `${logSamples.toLocaleString()} SAMPLES`
              : "READY"
        }
        tone={
          logging
            ? "warn"
            : "neutral"
        }
      />

      <StatusItem
        icon={
          <ShieldCheck
            size={12}
          />
        }
        label="VIEW"
        value={
          simplifiedMode
            ? "SIMPLIFIED"
            : "ADVANCED"
        }
        tone="neutral"
      />

      <div className="nexus-global-status-page">
        {activeWorkspace.toUpperCase()}
      </div>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value,
  tone,
}: {
  icon:
    React.ReactNode;

  label:
    string;

  value:
    string;

  tone:
    "good" |
    "warn" |
    "neutral";
}) {
  return (
    <div
      className={`nexus-status-item ${tone}`}
    >
      {icon}

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
