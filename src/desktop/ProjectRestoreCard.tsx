import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  FolderOpen,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import {
  buildProjectRestorePreview,
} from "./projectRestoreService";

import "./project-restore-card.css";

type Props = {
  savedState:
    NexusProjectSessionState | null;

  onRestore:
    () => void;

  onDismiss:
    () => void;

  onClear:
    () => void;
};

export function ProjectRestoreCard({
  savedState,
  onRestore,
  onDismiss,
  onClear,
}: Props) {
  const preview =
    useMemo(
      () =>
        savedState
          ? buildProjectRestorePreview(
              savedState,
            )
          : null,
      [
        savedState,
      ],
    );

  if (!preview) {
    return null;
  }

  return (
    <section className="project-restore-card">
      <div className="project-restore-card-header">
        <div>
          <FolderOpen
            size={16}
          />

          <div>
            <span className="eyebrow">
              PROJECT RESTORE
            </span>

            <h3>
              Resume Previous NEXUS Session
            </h3>
          </div>
        </div>

        <strong>
          SAVED
          {""}
          {new Date(
            preview.state.updatedAt,
          ).toLocaleString()}
        </strong>
      </div>

      <div className="project-restore-summary">
        <Summary
          label="AUTO RESTORE"
          value={
            preview.automaticCount
          }
        />

        <Summary
          label="MANUAL RECONNECT"
          value={
            preview.manualCount
          }
        />

        <Summary
          label="UNAVAILABLE"
          value={
            preview.unavailableCount
          }
        />
      </div>

      <div className="project-restore-items">
        {preview.items.map(
          entry => (
            <div
              key={
                entry.id
              }
              className={`project-restore-item ${entry.capability}`}
            >
              <div>
                {entry.capability ===
                "auto" ? (
                  <CheckCircle2
                    size={12}
                  />
                ) : entry.capability ===
                  "manual" ? (
                  <CircleAlert
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
                  {entry.label}
                </span>

                <strong>
                  {entry.value}
                </strong>

                <em>
                  {entry.detail}
                </em>
              </div>

              <b>
                {entry.capability ===
                "auto"
                  ? "AUTO"
                  : entry.capability ===
                    "manual"
                    ? "MANUAL"
                    : "N/A"}
              </b>
            </div>
          ),
        )}
      </div>

      <div className="project-restore-actions">
        <button
          type="button"
          onClick={
            onRestore
          }
        >
          <RotateCcw
            size={12}
          />

          RESTORE SESSION
        </button>

        <button
          type="button"
          onClick={
            onDismiss
          }
        >
          CONTINUE WITHOUT RESTORING
        </button>

        <button
          type="button"
          className="danger"
          onClick={
            onClear
          }
        >
          <Trash2
            size={12}
          />

          DELETE SAVED SESSION
        </button>
      </div>

      <div className="project-restore-note">
        Restoring never opens a COM port, reconnects an adapter,
        starts a diagnostic session, or performs ECU I/O. Hardware
        must always be reconnected manually.
      </div>
    </section>
  );
}

function Summary({
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
