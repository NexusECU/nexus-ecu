import {
  CheckCircle2,
  Cpu,
  Database,
  FileSearch,
  Gauge,
  Radio,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import "./ecu-control-center.css";

type Props = {
  vin: string;
  ecuName: string;
  romLoaded: boolean;
  onOpenHardware: () => void;
  onOpenDiagnostics: () => void;
  onOpenSafety: () => void;
};

export function EcuControlCenter({
  vin,
  ecuName,
  romLoaded,
  onOpenHardware,
  onOpenDiagnostics,
  onOpenSafety,
}: Props) {
  const identityReady =
    Boolean(
      vin ||
      ecuName,
    );

  const nextAction =
    !identityReady
      ? {
          title:
            "Identify the ECU",
          detail:
            "Connect live hardware and collect ECU identity evidence before relying on calibration context.",
          label:
            "OPEN HARDWARE",
          action:
            onOpenHardware,
        }
      : !romLoaded
        ? {
            title:
              "Add ROM context",
            detail:
              "A verified ROM image improves calibration, definition and backup context.",
            label:
              "CHECK DIAGNOSTICS",
            action:
              onOpenDiagnostics,
          }
        : {
            title:
              "Review safety readiness",
            detail:
              "Vehicle and ROM context are available. Review capability and safety gates before advanced ECU operations.",
            label:
              "OPEN SAFETY",
            action:
              onOpenSafety,
          };

  return (
    <div className="ecu-control-center">
      <section className="ecu-control-hero">
        <div className="ecu-control-title">
          <div className="ecu-control-icon">
            <Cpu size={22} />
          </div>

          <div>
            <span className="eyebrow">
              ECU CONTROL CENTRE
            </span>

            <h1>
              {ecuName ||
                "Unknown ECU"}
            </h1>

            <p>
              Identification, calibration context, ROM state and ECU
              workflow readiness in one dedicated page.
            </p>
          </div>
        </div>

        <div className="ecu-control-badges">
          <span
            className={
              identityReady
                ? "good"
                : ""
            }
          >
            {identityReady
              ? "IDENTITY AVAILABLE"
              : "IDENTITY UNKNOWN"}
          </span>

          <span
            className={
              romLoaded
                ? "good"
                : ""
            }
          >
            {romLoaded
              ? "ROM LOADED"
              : "NO ROM"}
          </span>
        </div>
      </section>

      <section className="ecu-next-action">
        <div>
          <span className="eyebrow">
            RECOMMENDED NEXT ACTION
          </span>

          <h2>
            {nextAction.title}
          </h2>

          <p>
            {nextAction.detail}
          </p>
        </div>

        <button
          type="button"
          onClick={
            nextAction.action
          }
        >
          {nextAction.label}
        </button>
      </section>

      <section className="ecu-status-strip">
        <StatusItem
          icon={
            <FileSearch size={13} />
          }
          label="IDENTITY"
          value={
            identityReady
              ? "AVAILABLE"
              : "UNKNOWN"
          }
          good={
            identityReady
          }
        />

        <StatusItem
          icon={
            <Database size={13} />
          }
          label="ROM"
          value={
            romLoaded
              ? "LOADED"
              : "NONE"
          }
          good={
            romLoaded
          }
        />

        <StatusItem
          icon={
            <Radio size={13} />
          }
          label="LIVE LINK"
          value="CHECK HARDWARE"
          good={false}
        />

        <StatusItem
          icon={
            <ShieldCheck size={13} />
          }
          label="SAFETY"
          value="REVIEW"
          good={false}
        />
      </section>

      <div className="ecu-control-grid">
        <section className="ecu-control-card">
          <div className="ecu-card-heading">
            <FileSearch size={16} />

            <div>
              <span className="eyebrow">
                IDENTITY
              </span>

              <h2>
                ECU Identification
              </h2>
            </div>
          </div>

          <div className="ecu-info-grid">
            <InfoRow
              label="ECU"
              value={
                ecuName ||
                "Unknown"
              }
            />

            <InfoRow
              label="VIN"
              value={
                vin ||
                "Unknown"
              }
            />

            <InfoRow
              label="CALIBRATION ID"
              value="Awaiting live evidence"
            />

            <InfoRow
              label="IDENTIFICATION"
              value={
                identityReady
                  ? "Project context available"
                  : "Not identified"
              }
            />
          </div>

          <button
            type="button"
            className="ecu-card-button"
            onClick={
              onOpenHardware
            }
          >
            OPEN LIVE HARDWARE
          </button>
        </section>

        <section className="ecu-control-card">
          <div className="ecu-card-heading">
            <Database size={16} />

            <div>
              <span className="eyebrow">
                CALIBRATION
              </span>

              <h2>
                ROM & Definition Context
              </h2>
            </div>
          </div>

          <div className="ecu-info-grid">
            <InfoRow
              label="ROM"
              value={
                romLoaded
                  ? "Loaded"
                  : "Not loaded"
              }
            />

            <InfoRow
              label="DEFINITION"
              value="Match required"
            />
          </div>

          <div className="ecu-card-note">
            <ShieldCheck size={13} />

            <span>
              Project ECU names and ROM files are context only.
              Live identification and safety gates remain authoritative.
            </span>
          </div>
        </section>

        <section className="ecu-control-card">
          <div className="ecu-card-heading">
            <Gauge size={16} />

            <div>
              <span className="eyebrow">
                CAPABILITIES
              </span>

              <h2>
                ECU Operations
              </h2>
            </div>
          </div>

          <div className="ecu-capability-stats">
            <div>
              <strong>
                —
              </strong>

              <span>
                AVAILABLE
              </span>
            </div>

            <div>
              <strong>
                —
              </strong>

              <span>
                BLOCKED
              </span>
            </div>
          </div>

          <button
            type="button"
            className="ecu-card-button"
            onClick={
              onOpenSafety
            }
          >
            REVIEW SAFETY & CAPABILITIES
          </button>
        </section>

        <section className="ecu-control-card">
          <div className="ecu-card-heading">
            <Wrench size={16} />

            <div>
              <span className="eyebrow">
                WORKFLOW
              </span>

              <h2>
                ECU Readiness
              </h2>
            </div>
          </div>

          <div className="ecu-readiness-list">
            <Readiness
              complete={
                identityReady
              }
              label="Vehicle / ECU context available"
            />

            <Readiness
              complete={
                romLoaded
              }
              label="ROM context loaded"
            />

            <Readiness
              complete={false}
              label="Live ECU responder confirmed"
            />

            <Readiness
              complete={false}
              label="Definition match verified"
            />

            <Readiness
              complete={false}
              label="Safety readiness reviewed"
            />
          </div>

          <button
            type="button"
            className="ecu-card-button"
            onClick={
              onOpenDiagnostics
            }
          >
            OPEN DIAGNOSTICS
          </button>
        </section>
      </div>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value,
  good,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div
      className={`ecu-status-item ${
        good
          ? "good"
          : ""
      }`}
    >
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="ecu-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Readiness({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <div
      className={
        complete
          ? "complete"
          : ""
      }
    >
      {complete ? (
        <CheckCircle2 size={13} />
      ) : (
        <span />
      )}

      <strong>
        {label}
      </strong>
    </div>
  );
}
