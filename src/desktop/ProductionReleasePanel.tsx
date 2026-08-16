import {
  CheckCircle2,
  CircleAlert,
  PackageCheck,
  Rocket,
} from "lucide-react";

import type {
  ReleaseReadinessSummary,
} from "./releaseReadinessTypes";

import "./production-release.css";

type Props = {
  summary:
    ReleaseReadinessSummary;

  version:
    string;
};

export function ProductionReleasePanel({
  summary,
  version,
}: Props) {
  return (
    <section className="production-release-panel">
      <div className="production-release-header">
        <div>
          <Rocket size={16} />

          <div>
            <span className="eyebrow">
              PRODUCTION RELEASE BASELINE
            </span>

            <h3>
              Release Readiness
            </h3>
          </div>
        </div>

        <div className={`production-release-state ${summary.status}`}>
          {summary.status === "ready" ? (
            <PackageCheck size={12} />
          ) : (
            <CircleAlert size={12} />
          )}

          {summary.status.toUpperCase()}
        </div>
      </div>

      <div className="production-release-metrics">
        <Info
          label="VERSION"
          value={version}
        />

        <Info
          label="READINESS SCORE"
          value={`${summary.score}/100`}
        />

        <Info
          label="REQUIRED BLOCKERS"
          value={String(summary.requiredBlocked)}
        />

        <Info
          label="RELEASE CHANNEL"
          value="STABLE"
        />
      </div>

      <div className="production-release-summary">
        {summary.summaryText}
      </div>

      <div className="production-release-checks">
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

            <span>
              {check.required ? "REQUIRED" : "ADVISORY"}
            </span>

            <p>{check.detail}</p>
          </div>
        ))}
      </div>

      <div className="production-release-footer"> is the first production release baseline for the
        current NEXUS ECU architecture. Live ECU programming and
        unrestricted transmit remain outside this baseline.
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
