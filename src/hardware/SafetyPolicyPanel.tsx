import {
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import type {
  SafetyPolicySummary,
} from "./safetyPolicyTypes";

import "./safety-policy.css";

type Props = {
  summary: SafetyPolicySummary;
};

export function SafetyPolicyPanel({
  summary,
}: Props) {
  return (
    <section className="safety-policy-panel">
      <div className="safety-policy-header">
        <div>
          <LockKeyhole size={16} />

          <div>
            <span className="eyebrow">
              SAFETY GATES & PRODUCTION HARDENING
            </span>

            <h3>
              Unified Production Safety Policy
            </h3>
          </div>
        </div>

        <div className={`safety-policy-decision ${summary.decision}`}>
          {summary.decision === "allow" ? (
            <ShieldCheck size={12} />
          ) : summary.decision === "block" ? (
            <ShieldX size={12} />
          ) : (
            <CircleAlert size={12} />
          )}

          {summary.decision.toUpperCase()}
        </div>
      </div>

      <div className="safety-policy-score">
        <div>
          <span>POLICY SCORE</span>
          <strong>{summary.score}/100</strong>
        </div>

        <div>
          <span>REQUIRED GATES</span>
          <strong>
            {summary.requiredPassed}/{summary.requiredTotal}
          </strong>
        </div>

        <div>
          <span>BLOCKERS</span>
          <strong>{summary.blockedReasons.length}</strong>
        </div>

        <div>
          <span>CAUTIONS</span>
          <strong>{summary.cautionReasons.length}</strong>
        </div>
      </div>

      <div className="safety-policy-summary">
        {summary.summaryText}
      </div>

      <div className="safety-policy-gates">
        {summary.gates.map(gate => (
          <div
            key={gate.id}
            className={gate.passed ? "passed" : "failed"}
          >
            {gate.passed ? (
              <CheckCircle2 size={11} />
            ) : (
              <CircleAlert size={11} />
            )}

            <strong>{gate.label}</strong>

            <span>
              {gate.required ? "REQUIRED" : "ADVISORY"}
            </span>

            <p>{gate.detail}</p>
          </div>
        ))}
      </div>

      {summary.blockedReasons.length > 0 && (
        <div className="safety-policy-blockers">
          <strong>BLOCKED REASONS</strong>

          {summary.blockedReasons.map(
            reason => (
              <p key={reason}>
                {reason}
              </p>
            ),
          )}
        </div>
      )}

      <div className="safety-policy-footer"> centralizes production safety decisions. The policy
        may block workflows, but it never enables ECU programming,
        arbitrary CAN transmission, security access, or flashing.
      </div>
    </section>
  );
}
