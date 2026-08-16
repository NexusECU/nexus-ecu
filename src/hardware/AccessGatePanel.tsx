import {
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
} from "lucide-react";

import type {
  AccessGateSummary,
} from "./accessGateTypes";

import "./access-gate-panel.css";

type Props = {
  summary:
    AccessGateSummary;
};

export function AccessGatePanel({
  summary,
}: Props) {
  return (
    <section className="access-gate-panel">
      <div className="access-gate-header">
        <div>
          <LockKeyhole
            size={16}
          />

          <div>
            <span className="eyebrow">
              ECU ACCESS CONTROL
            </span>

            <h3>
              Requested vs Effective Mode
            </h3>
          </div>
        </div>

        <div
          className={`access-gate-state ${
            summary.allowed
              ? "allowed"
              : "blocked"
          }`}
        >
          {summary.allowed ? (
            <CheckCircle2
              size={12}
            />
          ) : (
            <CircleAlert
              size={12}
            />
          )}

          {summary.effectiveMode.toUpperCase()}
        </div>
      </div>

      <div className="access-gate-summary">
        <div>
          <span>
            REQUESTED
          </span>

          <strong>
            {summary.requestedMode}
          </strong>
        </div>

        <div>
          <span>
            EFFECTIVE
          </span>

          <strong>
            {summary.effectiveMode}
          </strong>
        </div>
      </div>

      <p className="access-gate-message">
        {summary.summaryText}
      </p>

      <div className="access-gate-checks">
        {summary.checks
          .filter(
            check =>
              check.requiredFor.includes(
                summary.requestedMode,
              ),
          )
          .map(
            check => (
              <div
                key={
                  check.id
                }
                className={
                  check.passed
                    ? "passed"
                    : "failed"
                }
              >
                {check.passed ? (
                  <CheckCircle2
                    size={11}
                  />
                ) : (
                  <CircleAlert
                    size={11}
                  />
                )}

                <strong>
                  {check.label}
                </strong>

                <span>
                  {check.detail}
                </span>
              </div>
            ),
          )}
      </div>
    </section>
  );
}
