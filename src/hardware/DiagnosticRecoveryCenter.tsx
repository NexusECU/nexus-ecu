import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  RefreshCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  buildDiagnosticHealthSummary,
} from "./diagnosticEventService";

import type {
  DiagnosticEvent,
} from "./diagnosticEventTypes";

import "./diagnostic-recovery-center.css";

type Props = {
  events: DiagnosticEvent[];
  onClear: () => void;
  onRecoveryAction: (
    event:
      DiagnosticEvent,
  ) => void;
};

export function DiagnosticRecoveryCenter({
  events,
  onClear,
  onRecoveryAction,
}: Props) {
  const summary =
    useMemo(
      () =>
        buildDiagnosticHealthSummary(
          events,
        ),
      [
        events,
      ],
    );

  return (
    <section className="diagnostic-recovery-center">
      <div className="diagnostic-recovery-header">
        <div>
          <ShieldAlert
            size={16}
          />

          <div>
            <span className="eyebrow">
              DIAGNOSTICS, LOGGING & RECOVERY · V9.8
            </span>

            <h3>
              Unified Diagnostic Event Center
            </h3>
          </div>
        </div>

        <div
          className={`diagnostic-recovery-state ${summary.highestSeverity}`}
        >
          {summary.highestSeverity ===
          "critical" ? (
            <AlertOctagon
              size={12}
            />
          ) : summary.highestSeverity ===
            "error" ? (
            <AlertTriangle
              size={12}
            />
          ) : (
            <CheckCircle2
              size={12}
            />
          )}

          {summary.highestSeverity.toUpperCase()}
        </div>
      </div>

      <div className="diagnostic-recovery-stats">
        <Stat
          label="INFO"
          value={
            summary.infoCount
          }
        />

        <Stat
          label="WARNINGS"
          value={
            summary.warningCount
          }
        />

        <Stat
          label="ERRORS"
          value={
            summary.errorCount
          }
        />

        <Stat
          label="CRITICAL"
          value={
            summary.criticalCount
          }
        />

        <Stat
          label="ACTIONABLE"
          value={
            summary.actionableCount
          }
        />
      </div>

      <div className="diagnostic-recovery-actions">
        <button
          type="button"
          onClick={
            onClear
          }
        >
          <Trash2
            size={12}
          />

          CLEAR EVENT LOG
        </button>
      </div>

      <div className="diagnostic-recovery-list">
        {events.length ? (
          events.map(
            event => (
              <div
                key={
                  event.id
                }
                className={`diagnostic-recovery-event ${event.severity}`}
              >
                <div>
                  {event.severity ===
                  "critical" ? (
                    <AlertOctagon
                      size={12}
                    />
                  ) : event.severity ===
                    "error" ||
                    event.severity ===
                      "warning" ? (
                    <AlertTriangle
                      size={12}
                    />
                  ) : (
                    <CircleHelp
                      size={12}
                    />
                  )}
                </div>

                <div>
                  <span>
                    {new Date(
                      event.timestamp,
                    ).toLocaleString()}
                    {" · "}
                    {event.category.toUpperCase()}
                  </span>

                  <strong>
                    {event.title}
                  </strong>

                  <p>
                    {event.detail}
                  </p>

                  {event.recoveryAction && (
                    <em>
                      Recovery:{" "}
                      {event.recoveryAction}
                    </em>
                  )}
                </div>

                <div>
                  {event.recoveryAction && (
                    <button
                      type="button"
                      onClick={() =>
                        onRecoveryAction(
                          event,
                        )
                      }
                    >
                      <RefreshCcw
                        size={11}
                      />

                      RECOVER
                    </button>
                  )}
                </div>
              </div>
            ),
          )
        ) : (
          <div className="diagnostic-recovery-empty">
            No diagnostic events recorded yet.
          </div>
        )}
      </div>

      <div className="diagnostic-recovery-footer">
        v9.8 centralizes observed faults and recovery guidance.
        Recovery actions only restore local/session state and
        existing read-only connection flows; they do not bypass
        safety gates or perform ECU programming.
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
