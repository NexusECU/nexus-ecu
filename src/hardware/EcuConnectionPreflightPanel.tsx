import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ShieldAlert,
} from "lucide-react";

import type {
  EcuPreflightSummary,
} from "./ecuPreflightTypes";

import "./ecu-connection-preflight.css";

type Props = {
  summary: EcuPreflightSummary;
};

export function EcuConnectionPreflightPanel({
  summary,
}: Props) {
  return (
    <section className="ecu-preflight">
      <div className="ecu-preflight-header">
        <div>
          <ClipboardCheck size={16} />
          <div>
            <span className="eyebrow">
              ECU CONNECTION READINESS & PREFLIGHT · V9.6
            </span>
            <h3>Session Safety Gate</h3>
          </div>
        </div>

        <div className={`ecu-preflight-verdict ${summary.verdict}`}>
          {summary.verdict === "ready" ? (
            <CheckCircle2 size={12} />
          ) : (
            <ShieldAlert size={12} />
          )}
          {summary.verdict.toUpperCase()}
        </div>
      </div>

      <div className="ecu-preflight-score">
        <strong>
          {summary.passedCount}/{summary.totalCount}
        </strong>
        <span>CHECKS PASSED</span>
        <strong>{summary.requiredBlockedCount}</strong>
        <span>REQUIRED BLOCKERS</span>
      </div>

      <div className="ecu-preflight-summary">
        {summary.summaryText}
      </div>

      <div className="ecu-preflight-checks">
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

      <div className="ecu-preflight-footer">
        v9.6 is a readiness gate for the existing read-only workflow.
        It does not enable ECU programming, arbitrary CAN transmission,
        security access, or flashing.
      </div>
    </section>
  );
}
