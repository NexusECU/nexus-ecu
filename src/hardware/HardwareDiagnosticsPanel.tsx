import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  XCircle,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import {
  buildHardwareReadinessReport,
} from "./hardwareDiagnosticsService";

import "./hardware-diagnostics.css";

type Props = {
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

  vin:
    string | null;

  calibrationIds:
    string[];

  lastError:
    string | null;
};

export function HardwareDiagnosticsPanel({
  connection,
  frames,
  adapterDetected,
  canMonitorActive,
  bitrateKbps,
  vin,
  calibrationIds,
  lastError,
}: Props) {
  const report =
    useMemo(
      () =>
        buildHardwareReadinessReport(
          connection,
          frames,
          adapterDetected,
          canMonitorActive,
          bitrateKbps,
          vin,
          calibrationIds,
          lastError,
        ),
      [
        connection,
        frames,
        adapterDetected,
        canMonitorActive,
        bitrateKbps,
        vin,
        calibrationIds,
        lastError,
      ],
    );

  return (
    <section className="hardware-diagnostics">
      <div className="hardware-diagnostics-header">
        <div>
          <ClipboardCheck
            size={16}
          />

          <div>
            <span className="eyebrow">
              HARDWARE TEST & DIAGNOSTICS · V7.3
            </span>

            <h3>
              Hardware Readiness Report
            </h3>
          </div>
        </div>

        <div
          className={`hardware-diagnostics-result ${
            report.ready
              ? "ready"
              : "not-ready"
          }`}
        >
          {report.ready
            ? "READ-ONLY PATH READY"
            : "NOT READY"}
        </div>
      </div>

      <div className="hardware-diagnostics-stats">
        <Stat
          label="PASSED"
          value={String(report.passed)}
        />

        <Stat
          label="FAILED"
          value={String(report.failed)}
        />

        <Stat
          label="WARNINGS"
          value={String(report.warnings)}
        />

        <Stat
          label="UNKNOWN"
          value={String(report.unknown)}
        />

        <Stat
          label="FRAMES"
          value={frames.length.toLocaleString()}
        />
      </div>

      <div className="hardware-diagnostics-checks">
        {report.checks.map(
          check => (
            <div
              key={check.id}
              className={`hardware-diagnostic-check ${check.status}`}
            >
              <div className="hardware-diagnostic-icon">
                {check.status === "pass" ? (
                  <CheckCircle2 size={14}/>
                ) : check.status === "fail" ? (
                  <XCircle size={14}/>
                ) : check.status === "warning" ? (
                  <AlertTriangle size={14}/>
                ) : (
                  <CircleHelp size={14}/>
                )}
              </div>

              <div>
                <strong>
                  {check.label}
                </strong>

                <span>
                  {check.detail}
                </span>
              </div>

              <em>
                {check.status.toUpperCase()}
              </em>
            </div>
          ),
        )}
      </div>

      <div className="hardware-diagnostics-footer">
        This report only evaluates the read-only hardware path.
        It does not unlock ECU programming, memory write, security
        access or flash operations.
      </div>
    </section>
  );
}

function Stat({
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
