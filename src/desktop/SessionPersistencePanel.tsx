import {
  CheckCircle2,
  DatabaseBackup,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import "./session-persistence.css";

type Props = {
  currentState:
    NexusProjectSessionState;

  restoredState:
    NexusProjectSessionState | null;

  onSave:
    () => void;

  onRestore:
    () => void;

  onClear:
    () => void;
};

export function SessionPersistencePanel({
  currentState,
  restoredState,
  onSave,
  onRestore,
  onClear,
}: Props) {
  const [
    savedFlash,
    setSavedFlash,
  ] = useState(
    false,
  );

  useEffect(
    () => {
      if (!savedFlash) {
        return;
      }

      const timer =
        window.setTimeout(
          () =>
            setSavedFlash(
              false,
            ),
          1400,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [
      savedFlash,
    ],
  );

  const save =
    () => {
      onSave();
      setSavedFlash(
        true,
      );
    };

  return (
    <section className="session-persistence-panel">
      <div className="session-persistence-header">
        <div>
          <DatabaseBackup
            size={16}
          />

          <div>
            <span className="eyebrow">
              SESSION PERSISTENCE
            </span>

            <h3>
              Project / Hardware Session Binding
            </h3>
          </div>
        </div>

        <div
          className={`session-persistence-state ${
            restoredState
              ? "saved"
              : "empty"
          }`}
        >
          {restoredState ? (
            <CheckCircle2
              size={12}
            />
          ) : (
            <DatabaseBackup
              size={12}
            />
          )}

          {restoredState
            ? "RESTORE POINT AVAILABLE"
            : "NO SAVED SESSION"}
        </div>
      </div>

      <div className="session-persistence-grid">
        <Info
          label="PROVIDER"
          value={
            currentState.hardware.providerId.toUpperCase()
          }
        />

        <Info
          label="SERIAL PORT"
          value={
            currentState.hardware.selectedPort ||
            "NONE"
          }
        />

        <Info
          label="CAN BITRATE"
          value={
            `${currentState.hardware.canBitrateKbps} KBIT/S`
          }
        />

        <Info
          label="WORKSPACE TAB"
          value={
            currentState.hardware.workspaceTab.toUpperCase()
          }
        />

        <Info
          label="ECU ADDRESS"
          value={
            currentState.hardware.selectedEcuAddress ||
            "AUTO"
          }
        />

        <Info
          label="VIN"
          value={
            currentState.hardware.identity.vin ||
            "UNKNOWN"
          }
        />

        <Info
          label="ROM"
          value={
            currentState.rom?.fileName ??
            "NONE"
          }
        />

        <Info
          label="DEFINITION"
          value={
            currentState.definition?.name ??
            "NONE"
          }
        />
      </div>

      <div className="session-persistence-actions">
        <button
          type="button"
          onClick={
            save
          }
        >
          <Save
            size={12}
          />

          SAVE SESSION
        </button>

        <button
          type="button"
          disabled={
            !restoredState
          }
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
          disabled={
            !restoredState
          }
          onClick={
            onClear
          }
        >
          <Trash2
            size={12}
          />

          CLEAR SAVED SESSION
        </button>

        {savedFlash && (
          <span className="session-persistence-saved-flash">
            Session saved.
          </span>
        )}
      </div>

      <div className="session-persistence-note"> stores project/session metadata only. It does not
        automatically reconnect hardware, reopen a COM port, or
        execute ECU commands when NEXUS starts.
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
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
