import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Link2,
  ShieldCheck,
} from "lucide-react";

import type {
  CalibrationBindingSummary,
} from "./calibrationBindingTypes";

import "./calibration-binding.css";

type Props = {
  summary: CalibrationBindingSummary;
};

export function CalibrationBindingPanel({
  summary,
}: Props) {
  return (
    <section className="calibration-binding">
      <div className="calibration-binding-header">
        <div>
          <Link2 size={16} />

          <div>
            <span className="eyebrow">
              ROM & DEFINITION BINDING HARDENING · V9.7
            </span>

            <h3>
              Verified Calibration Context
            </h3>
          </div>
        </div>

        <div className={`calibration-binding-state ${summary.status}`}>
          {summary.status === "verified" ? (
            <ShieldCheck size={12} />
          ) : summary.status === "mismatch" ? (
            <CircleAlert size={12} />
          ) : (
            <CircleHelp size={12} />
          )}

          {summary.status.toUpperCase()}
        </div>
      </div>

      <div className="calibration-binding-grid">
        <Info
          label="PROJECT"
          value={summary.projectLabel}
        />

        <Info
          label="VIN"
          value={summary.vin ?? "UNKNOWN"}
        />

        <Info
          label="CALIBRATION ID"
          value={summary.calibrationId ?? "UNKNOWN"}
        />

        <Info
          label="DEFINITION"
          value={summary.definitionName ?? "NONE"}
        />

        <Info
          label="DEFINITION ROM ID"
          value={summary.definitionRomId ?? "UNKNOWN"}
        />

        <Info
          label="ROM"
          value={summary.romFileName ?? "NONE"}
        />
      </div>

      <div className="calibration-binding-score">
        <strong>{summary.score}/100</strong>
        <span>BINDING SCORE</span>
        <p>{summary.summaryText}</p>
      </div>

      <div className="calibration-binding-checks">
        {summary.checks.map(check => (
          <div
            key={check.id}
            className={check.passed ? "passed" : "failed"}
          >
            {check.passed ? (
              <CheckCircle2 size={11} />
            ) : (
              <CircleAlert size={11} />
            )}

            <strong>{check.label}</strong>
            <span>{check.detail}</span>
          </div>
        ))}
      </div>

      {summary.romSha256 && (
        <div className="calibration-binding-hash">
          <span>ROM SHA-256</span>
          <strong>{summary.romSha256}</strong>
        </div>
      )}

      <div className="calibration-binding-footer">
        v9.7 treats identity/definition/ROM agreement as a required
        calibration-context check. A verified binding does not itself
        authorize ECU write, flash, or programming operations.
      </div>
    </section>
  );
}

function Info({
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
