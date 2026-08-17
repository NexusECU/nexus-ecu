import {
  Activity,
  BookOpen,
  CircleCheck,
  CircleDot,
  Database,
  FolderOpen,
  Gauge,
  Radio,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Usb,
} from "lucide-react";

import "./v10-dashboard.css";

type Props = {
  projectName: string;
  projectSaved: boolean;
  liveMode: boolean;
  engineRunning: boolean;
  rpm: number;
  batteryVoltage: number;
  coolantC: number;
  romLoaded: boolean;
  logging: boolean;
  logSamples: number;
  onOpenProject: () => void;
  onOpenHardware: () => void;
  onOpenEcu: () => void;
  onOpenDiagnostics: () => void;
  onOpenTuning: () => void;
  onOpenLogging: () => void;
  onOpenSafety: () => void;
  onOpenSettings: () => void;
};

type WorkflowStep = {
  label: string;
  detail: string;
  complete: boolean;
  current: boolean;
};

export function AdvancedHomeDashboard({
  projectName,
  projectSaved,
  liveMode,
  engineRunning,
  rpm,
  batteryVoltage,
  coolantC,
  romLoaded,
  logging,
  logSamples,
  onOpenProject,
  onOpenHardware,
  onOpenEcu,
  onOpenDiagnostics,
  onOpenTuning,
  onOpenLogging,
  onOpenSafety,
  onOpenSettings,
}: Props) {
  const hasProject =
    Boolean(projectName) &&
    projectName !== "Untitled Project";

  const hasLog = logSamples > 0;

  const recommendedAction =
    !hasProject
      ? {
          eyebrow: "START HERE",
          title: "Create or open a vehicle project",
          detail:
            "A project keeps vehicle identity, ECU context, ROMs, revisions and logs together.",
          action: onOpenProject,
          label: "OPEN PROJECT",
        }
      : !liveMode
        ? {
            eyebrow: "NEXT STEP",
            title: "Connect to the vehicle",
            detail:
              "Use the Hardware wizard to select an interface, verify the link and detect the vehicle network.",
            action: onOpenHardware,
            label: "CONNECT HARDWARE",
          }
        : !romLoaded
          ? {
              eyebrow: "NEXT STEP",
              title: "Confirm ECU identity",
              detail:
                "Review ECU identity, calibration evidence and ROM context before moving into advanced workflows.",
              action: onOpenEcu,
              label: "OPEN ECU",
            }
          : {
              eyebrow: "READY TO CONTINUE",
              title: "Review readiness before tuning",
              detail:
                "Check capability and safety gates, then continue to tuning or logging when the session is ready.",
              action: onOpenSafety,
              label: "CHECK SAFETY",
            };

  const workflowSteps: WorkflowStep[] = [
    {
      label: "Project",
      detail: hasProject ? projectName : "No vehicle project selected",
      complete: hasProject,
      current: !hasProject,
    },
    {
      label: "Hardware",
      detail: liveMode ? "Live ECU environment selected" : "Vehicle connection not active",
      complete: liveMode,
      current: hasProject && !liveMode,
    },
    {
      label: "ECU Context",
      detail: romLoaded ? "ROM / calibration context available" : "Identity or ROM context still required",
      complete: romLoaded,
      current: hasProject && liveMode && !romLoaded,
    },
    {
      label: "Session",
      detail: hasLog ? `${logSamples.toLocaleString()} telemetry samples available` : "Ready for diagnostics, logging or tuning",
      complete: hasProject && liveMode && romLoaded,
      current: hasProject && liveMode && romLoaded,
    },
  ];

  return (
    <div className="nexus-dashboard-page nexus-home-v2">
      <section className="nexus-home-hero">
        <div className="nexus-home-hero-copy">
          <div className="nexus-home-kicker">
            <Radio size={13} />
            NEXUS ECU COMMAND CENTRE
          </div>

          <h1>{hasProject ? projectName : "No active vehicle project"}</h1>

          <p>
            One place for project status, live vehicle context, ECU readiness,
            diagnostics, calibration and logging.
          </p>

          <div className="nexus-home-hero-status">
            <StatusPill
              label={projectSaved ? "PROJECT SAVED" : "UNSAVED CHANGES"}
              tone={projectSaved ? "good" : "warn"}
            />
            <StatusPill
              label={liveMode ? "LIVE ECU" : "OFFLINE / SIMULATOR"}
              tone={liveMode ? "good" : "neutral"}
            />
            <StatusPill
              label={romLoaded ? "ROM CONTEXT READY" : "NO ROM CONTEXT"}
              tone={romLoaded ? "good" : "neutral"}
            />
            <StatusPill
              label={logging ? "LOGGING ACTIVE" : "LOGGER READY"}
              tone={logging ? "warn" : "neutral"}
            />
          </div>
        </div>

        <div className="nexus-home-hero-gauge">
          <span>SESSION</span>
          <strong>{engineRunning ? "ACTIVE" : liveMode ? "CONNECTED" : "IDLE"}</strong>
          <small>{engineRunning ? `${Math.round(rpm).toLocaleString()} RPM` : "Engine stopped"}</small>
        </div>
      </section>

      <section className="nexus-home-workflow">
        {workflowSteps.map((step, index) => (
          <div
            key={step.label}
            className={`nexus-home-workflow-step ${step.complete ? "complete" : ""} ${step.current ? "current" : ""}`}
          >
            <div className="nexus-home-workflow-number">
              {step.complete ? <CircleCheck size={17} /> : <CircleDot size={17} />}
            </div>
            <div>
              <span>0{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </div>
          </div>
        ))}
      </section>

      <section className="nexus-home-next-action">
        <div>
          <span className="eyebrow">{recommendedAction.eyebrow}</span>
          <h2>{recommendedAction.title}</h2>
          <p>{recommendedAction.detail}</p>
        </div>
        <button type="button" onClick={recommendedAction.action}>
          {recommendedAction.label}
        </button>
      </section>

      <div className="nexus-home-main-grid">
        <section className="nexus-home-panel nexus-home-telemetry-panel">
          <PanelHeading
            icon={<Gauge size={17} />}
            eyebrow="LIVE STATUS"
            title="Vehicle & Session"
          />

          <div className="nexus-home-metrics">
            <Metric label="ENGINE" value={engineRunning ? "RUNNING" : "STOPPED"} tone={engineRunning ? "good" : "neutral"} />
            <Metric label="RPM" value={Math.round(rpm).toLocaleString()} />
            <Metric label="BATTERY" value={`${batteryVoltage.toFixed(2)} V`} tone={batteryVoltage >= 12 ? "good" : "warn"} />
            <Metric label="COOLANT" value={`${coolantC.toFixed(1)} °C`} tone={coolantC >= 105 ? "warn" : "neutral"} />
            <Metric label="ROM" value={romLoaded ? "LOADED" : "NONE"} tone={romLoaded ? "good" : "neutral"} />
            <Metric
              label="LOGGER"
              value={logging ? "RECORDING" : hasLog ? `${logSamples.toLocaleString()} SAMPLES` : "READY"}
              tone={logging ? "warn" : hasLog ? "good" : "neutral"}
            />
          </div>

          {!liveMode && (
            <EmptyState
              title="No live vehicle connection"
              detail="Open Hardware to connect an adapter and begin a real ECU session."
              action="OPEN HARDWARE"
              onClick={onOpenHardware}
            />
          )}
        </section>

        <section className="nexus-home-panel">
          <PanelHeading
            icon={<Activity size={17} />}
            eyebrow="WORKSPACES"
            title="Quick Launch"
          />

          <div className="nexus-home-launch-grid">
            <LaunchButton icon={<FolderOpen size={16} />} title="Project" detail="Vehicle and project files" onClick={onOpenProject} />
            <LaunchButton icon={<Usb size={16} />} title="Hardware" detail="Connect vehicle interface" onClick={onOpenHardware} />
            <LaunchButton icon={<Database size={16} />} title="ECU" detail="Identity and ROM context" onClick={onOpenEcu} />
            <LaunchButton icon={<Activity size={16} />} title="Diagnostics" detail="Health and faults" onClick={onOpenDiagnostics} />
            <LaunchButton icon={<SlidersHorizontal size={16} />} title="Tuning" detail="Calibration workspace" onClick={onOpenTuning} />
            <LaunchButton icon={<Gauge size={16} />} title="Logging" detail="Record and review data" onClick={onOpenLogging} />
            <LaunchButton icon={<ShieldCheck size={16} />} title="Safety" detail="Readiness and gates" onClick={onOpenSafety} />
            <LaunchButton icon={<Settings size={16} />} title="Settings" detail="View and access modes" onClick={onOpenSettings} />
          </div>
        </section>

        <section className="nexus-home-panel">
          <PanelHeading
            icon={<ShieldCheck size={17} />}
            eyebrow="READINESS"
            title="Session Overview"
          />

          <div className="nexus-home-readiness-list">
            <ReadinessRow label="Vehicle project" value={hasProject ? "Ready" : "Required"} ready={hasProject} />
            <ReadinessRow label="Live hardware" value={liveMode ? "Live ECU" : "Not connected"} ready={liveMode} />
            <ReadinessRow label="ROM context" value={romLoaded ? "Loaded" : "Missing"} ready={romLoaded} />
            <ReadinessRow label="Data capture" value={hasLog ? "Log available" : "No log yet"} ready={hasLog} optional />
          </div>

          <button type="button" className="nexus-home-secondary-action" onClick={onOpenSafety}>
            OPEN SAFETY CENTRE
          </button>
        </section>

        <section className="nexus-home-panel nexus-home-help-panel">
          <PanelHeading
            icon={<BookOpen size={17} />}
            eyebrow="GUIDANCE"
            title="Help & Learning"
          />

          <p>
            Use the guided tutorial for a full walkthrough, or switch to
            Simplified View when you want NEXUS to reduce technical detail and
            guide you through each workflow.
          </p>

          <div className="nexus-home-help-actions">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("nexus:start-tutorial"))
              }
            >
              RESTART TUTORIAL
            </button>
            <button type="button" onClick={onOpenSettings}>
              OPEN SETTINGS
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "neutral";
}) {
  return <span className={`nexus-home-pill ${tone}`}>{label}</span>;
}

function PanelHeading({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="nexus-home-panel-heading">
      <div className="nexus-home-panel-icon">{icon}</div>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <div className={`nexus-home-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LaunchButton({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="nexus-home-launch" onClick={onClick}>
      <div>{icon}</div>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </button>
  );
}

function ReadinessRow({
  label,
  value,
  ready,
  optional = false,
}: {
  label: string;
  value: string;
  ready: boolean;
  optional?: boolean;
}) {
  return (
    <div className={`nexus-home-readiness-row ${ready ? "ready" : ""}`}>
      <span className="nexus-home-readiness-dot" />
      <strong>{label}</strong>
      {optional && <em>OPTIONAL</em>}
      <span>{value}</span>
    </div>
  );
}

function EmptyState({
  title,
  detail,
  action,
  onClick,
}: {
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="nexus-home-empty">
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <button type="button" onClick={onClick}>{action}</button>
    </div>
  );
}
