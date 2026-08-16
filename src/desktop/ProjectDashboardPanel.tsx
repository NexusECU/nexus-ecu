import {
  Activity,
  Archive,
  CarFront,
  Clock3,
  Cpu,
  FolderOpen,
  Gauge,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import type {
  VehicleProjectProfile,
} from "./vehicleProjectTypes";

import {
  listProjectBackups,
  listProjectHistory,
  listProjectRestorePoints,
} from "./projectHistoryService";

import "./project-dashboard.css";

type Props = {
  activeProject:
    VehicleProjectProfile | null;

  currentSession:
    NexusProjectSessionState;

  adapterConnected:
    boolean;

  canActive:
    boolean;

  frameCount:
    number;

  onOpenSession:
    () => void;

  onOpenBackups:
    () => void;

  onOpenBrowser:
    () => void;

  onSaveProject:
    () => void;
};

export function ProjectDashboardPanel({
  activeProject,
  currentSession,
  adapterConnected,
  canActive,
  frameCount,
  onOpenSession,
  onOpenBackups,
  onOpenBrowser,
  onSaveProject,
}: Props) {
  const history =
    useMemo(
      () =>
        activeProject
          ? listProjectHistory(
              activeProject.id,
            )
          : [],
      [
        activeProject?.id,
      ],
    );

  const backups =
    useMemo(
      () =>
        activeProject
          ? listProjectBackups(
              activeProject.id,
            )
          : [],
      [
        activeProject?.id,
      ],
    );

  const restorePoints =
    useMemo(
      () =>
        activeProject
          ? listProjectRestorePoints(
              activeProject.id,
            )
          : [],
      [
        activeProject?.id,
      ],
    );

  if (!activeProject) {
    return (
      <section className="project-dashboard">
        <div className="project-dashboard-empty">
          Open or create a vehicle project to view the
          project dashboard.
        </div>
      </section>
    );
  }

  const latestHistory =
    history.slice(
      0,
      5,
    );

  return (
    <section className="project-dashboard">
      <div className="project-dashboard-header">
        <div>
          <CarFront
            size={17}
          />

          <div>
            <span className="eyebrow">
              PROJECT DASHBOARD
            </span>

            <h2>
              {activeProject.name}
            </h2>

            <p>
              {activeProject.vehicleLabel}
            </p>
          </div>
        </div>

        <div className="project-dashboard-health">
          <ShieldCheck
            size={13}
          />

          {adapterConnected
            ? "ACTIVE SESSION"
            : "OFFLINE PROJECT"}
        </div>
      </div>

      <div className="project-dashboard-metrics">
        <Metric
          label="VIN"
          value={
            activeProject.vin ??
            "UNKNOWN"
          }
          detail="Vehicle identity"
        />

        <Metric
          label="ECU"
          value={
            activeProject.ecuLabel ||
            "AUTO"
          }
          detail="Selected controller"
        />

        <Metric
          label="CALIBRATION"
          value={
            activeProject.calibrationId ??
            "UNKNOWN"
          }
          detail="Calibration identity"
        />

        <Metric
          label="ROM"
          value={
            currentSession.rom?.fileName ??
            "NONE"
          }
          detail={
            currentSession.rom
              ? `${currentSession.rom.sizeBytes.toLocaleString()} bytes`
              : "No ROM bound"
          }
        />

        <Metric
          label="BACKUPS"
          value={
            String(
              backups.length,
            )
          }
          detail="Recorded ROM backups"
        />

        <Metric
          label="RESTORE POINTS"
          value={
            String(
              restorePoints.length,
            )
          }
          detail="Session restore points"
        />
      </div>

      <div className="project-dashboard-main">
        <div className="project-dashboard-card">
          <div className="project-dashboard-card-title">
            <Gauge
              size={12}
            />

            LIVE SESSION STATUS
          </div>

          <StatusRow
            label="ADAPTER"
            value={
              adapterConnected
                ? "CONNECTED"
                : "DISCONNECTED"
            }
            ok={
              adapterConnected
            }
          />

          <StatusRow
            label="CAN MONITOR"
            value={
              canActive
                ? "ACTIVE"
                : "INACTIVE"
            }
            ok={
              canActive
            }
          />

          <StatusRow
            label="FRAME COUNT"
            value={
              frameCount.toLocaleString()
            }
            ok={
              frameCount >
              0
            }
          />

          <StatusRow
            label="PROVIDER"
            value={
              currentSession.hardware.providerId.toUpperCase()
            }
            ok={
              true
            }
          />
        </div>

        <div className="project-dashboard-card">
          <div className="project-dashboard-card-title">
            <Clock3
              size={12}
            />

            RECENT PROJECT HISTORY
          </div>

          {latestHistory.length ? (
            latestHistory.map(
              item => (
                <div
                  key={
                    item.id
                  }
                  className="project-dashboard-history"
                >
                  <span>
                    {new Date(
                      item.createdAt,
                    ).toLocaleString()}
                  </span>

                  <strong>
                    {item.title}
                  </strong>

                  <em>
                    {item.detail}
                  </em>
                </div>
              ),
            )
          ) : (
            <div className="project-dashboard-empty small">
              No project history yet.
            </div>
          )}
        </div>

        <div className="project-dashboard-card">
          <div className="project-dashboard-card-title">
            <Cpu
              size={12}
            />

            PROJECT IDENTITY
          </div>

          <Identity
            label="PROJECT ID"
            value={
              activeProject.id
            }
          />

          <Identity
            label="VEHICLE"
            value={
              activeProject.vehicleLabel
            }
          />

          <Identity
            label="SERIAL PORT"
            value={
              currentSession.hardware.selectedPort ||
              "NONE"
            }
          />

          <Identity
            label="CAN BITRATE"
            value={
              `${currentSession.hardware.canBitrateKbps} KBIT/S`
            }
          />

          <Identity
            label="LAST UPDATED"
            value={
              new Date(
                activeProject.updatedAt,
              ).toLocaleString()
            }
          />
        </div>
      </div>

      <div className="project-dashboard-actions">
        <button
          type="button"
          onClick={
            onOpenSession
          }
        >
          <Activity
            size={12}
          />

          OPEN ECU SESSION
        </button>

        <button
          type="button"
          onClick={
            onOpenBackups
          }
        >
          <Archive
            size={12}
          />

          OPEN BACKUPS
        </button>

        <button
          type="button"
          onClick={
            onOpenBrowser
          }
        >
          <FolderOpen
            size={12}
          />

          OPEN PROJECT FILES
        </button>

        <button
          type="button"
          onClick={
            onSaveProject
          }
        >
          <Save
            size={12}
          />

          SAVE PROJECT
        </button>
      </div>

      <div className="project-dashboard-footer"> provides a unified project overview. Hardware
        reconnect, ECU reads, writes and programming remain
        governed by the existing session and capability gates.
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label:
    string;

  value:
    string;

  detail:
    string;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <em>
        {detail}
      </em>
    </div>
  );
}

function StatusRow({
  label,
  value,
  ok,
}: {
  label:
    string;

  value:
    string;

  ok:
    boolean;
}) {
  return (
    <div className={`project-dashboard-status ${ok ? "ok" : ""}`}>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Identity({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="project-dashboard-identity">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
