import {
  Activity,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  loadAccessSettings,
  saveAccessSettings,
  type NexusAccessMode,
  type NexusAccessSettings,
} from "./accessModeSettings";

import "./access-mode-settings.css";

const modes:
  Array<{
    key:
      NexusAccessMode;

    label:
      string;

    detail:
      string;
  }> = [
    {
      key:
        "read-only",
      label:
        "Read Only",
      detail:
        "Passive monitoring, ECU identification, diagnostics evidence, ROM context and backup workflows.",
    },
    {
      key:
        "advanced-diagnostic",
      label:
        "Advanced Diagnostic",
      detail:
        "Allows only supported request/response diagnostic workflows after the live-session gates pass.",
    },
    {
      key:
        "programming",
      label:
        "Programming",
      detail:
        "Arms programming-only workflows after strict ECU, backup, voltage, definition and safety gates pass.",
    },
  ];

export function AccessModeSettingsPanel() {
  const [
    settings,
    setSettings,
  ] = useState<
    NexusAccessSettings
  >(
    () =>
      loadAccessSettings(),
  );

  useEffect(
    () => {
      saveAccessSettings(
        settings,
      );
    },
    [
      settings,
    ],
  );

  return (
    <section className="access-mode-settings">
      <div className="access-mode-heading">
        <LockKeyhole
          size={17}
        />

        <div>
          <span className="eyebrow">
            ECU ACCESS
          </span>

          <h3>
            Operating Access Mode
          </h3>

          <p>
            Choose the maximum ECU access level NEXUS may request.
            Live safety gates can always reduce this to Read Only.
          </p>
        </div>
      </div>

      <div className="access-mode-options">
        {modes.map(
          mode => (
            <button
              type="button"
              key={
                mode.key
              }
              className={
                settings.requestedMode ===
                mode.key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSettings(
                  current => ({
                    ...current,

                    requestedMode:
                      mode.key,

                    programmingAcknowledged:
                      mode.key ===
                      "programming"
                        ? current.programmingAcknowledged
                        : false,
                  }),
                )
              }
            >
              <span className="access-mode-icon">
                {mode.key ===
                "read-only" ? (
                  <ShieldCheck
                    size={16}
                  />
                ) : mode.key ===
                  "advanced-diagnostic" ? (
                  <Activity
                    size={16}
                  />
                ) : (
                  <TriangleAlert
                    size={16}
                  />
                )}
              </span>

              <span className="access-mode-copy">
                <strong>
                  {mode.label}
                </strong>

                <em>
                  {mode.detail}
                </em>
              </span>

              {settings.requestedMode ===
                mode.key && (
                <CheckCircle2
                  size={15}
                />
              )}
            </button>
          ),
        )}
      </div>

      {settings.requestedMode ===
        "programming" && (
        <label className="programming-ack">
          <input
            type="checkbox"
            checked={
              settings.programmingAcknowledged
            }
            onChange={
              event =>
                setSettings(
                  current => ({
                    ...current,

                    programmingAcknowledged:
                      event.target.checked,
                  }),
                )
            }
          />

          <span>
            I understand that ECU programming can make a vehicle
            inoperable if power, communication, ECU identity or
            calibration context is incorrect.
          </span>
        </label>
      )}

      <div className="access-mode-warning">
        Selecting Programming does not bypass safety gates and
        does not expose unrestricted CAN transmit, security
        bypass, memory-write or raw flashing commands.
      </div>
    </section>
  );
}
