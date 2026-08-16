import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  NexusHeaderWorkspace,
} from "./DesktopShell";

import "./nexus-primary-tutorial.css";

type Props = {
  onWorkspaceChange: (
    workspace:
      NexusHeaderWorkspace,
  ) => void;
};

const KEY =
  "nexus.primaryTutorial.v10.2.complete";

const steps:
  Array<{
    title:
      string;

    detail:
      string;

    workspace:
      NexusHeaderWorkspace;

    tip?:
      string;
  }> = [
    {
      title:
        "Welcome to NEXUS ECU",
      detail:
        "NEXUS is organised into separate pages across the top header. Only the page you select is shown, so you no longer need to scroll through the entire application.",
      workspace:
        "home",
      tip:
        "Use the top tabs to move between each major workflow.",
    },
    {
      title:
        "Home",
      detail:
        "Home is your main vehicle and engine overview. Use it for live status, telemetry, engine state and the general ECU dashboard.",
      workspace:
        "home",
      tip:
        "Home is the best place to start when you want a quick overview of the current session.",
    },
    {
      title:
        "Project",
      detail:
        "Project contains vehicle details, calibration revisions, notes, saved project data and project files. New projects can only be created from this page.",
      workspace:
        "project",
      tip:
        "If you press Ctrl+N from another page, NEXUS takes you to Project first instead of immediately creating a new project.",
    },
    {
      title:
        "Hardware",
      detail:
        "Hardware is dedicated to the real vehicle interface. It automatically uses Live ECU mode and contains provider selection, COM/J2534 connections, CAN bitrate, CAN monitoring and adapter status.",
      workspace:
        "hardware",
      tip:
        "Simulator controls are intentionally hidden from the Hardware page.",
    },
    {
      title:
        "ECU",
      detail:
        "ECU is a separate page for controller identification and calibration context. Use it to review ECU evidence, VIN, Calibration ID, definition matching, ROM context and backup information.",
      workspace:
        "ecu",
      tip:
        "Connect hardware first if you want live ECU identification evidence.",
    },
    {
      title:
        "Diagnostics",
      detail:
        "Diagnostics is dedicated to ECU and communication health. Review diagnostic status, protocol/channel evidence, hardware readiness, fault information and recovery guidance here.",
      workspace:
        "diagnostics",
      tip:
        "Diagnostics is separate from Hardware setup and ECU identification.",
    },
    {
      title:
        "Tuning",
      detail:
        "Tuning contains your calibration maps and tuning tools. This is where fuel, ignition, boost, definitions, calibration management and supported tuning workflows belong.",
      workspace:
        "tuning",
      tip:
        "Keep a project and a verified calibration context before making major calibration changes.",
    },
    {
      title:
        "Logging",
      detail:
        "Logging is the dedicated data-recording page. Start and stop logs, review captured samples, add markers and inspect telemetry from test runs or supported live sessions.",
      workspace:
        "logging",
      tip:
        "Logs are most useful when tied to a project and a known vehicle/ECU context.",
    },
    {
      title:
        "Safety",
      detail:
        "Safety contains compatibility, capability and readiness gates. It shows what NEXUS believes is safe and available before higher-risk ECU operations can proceed.",
      workspace:
        "safety",
      tip:
        "A blocked gate is there to stop an unsafe or incomplete workflow, not just to display a warning.",
    },
    {
      title:
        "Settings: View Mode",
      detail:
        "Settings lets you choose Simplified View or Advanced View. Simplified View uses plain-language explanations, recommended next actions and less technical clutter. Advanced View exposes the full technical interface.",
      workspace:
        "settings",
      tip:
        "Both views use the same underlying ECU safety checks.",
    },
    {
      title:
        "Settings: ECU Access",
      detail:
        "NEXUS also supports Read Only, Advanced Diagnostic and Programming access modes. Selecting a higher access mode only requests that level; live safety gates can still reduce the effective mode back to Read Only.",
      workspace:
        "settings",
      tip:
        "Programming mode does not bypass compatibility, backup, voltage, identity or safety requirements.",
    },
    {
      title:
        "You’re ready",
      detail:
        "Use the top tabs for each workflow and return to this tutorial whenever you need a refresher. NEXUS keeps project, hardware, ECU, diagnostics, tuning, logging, safety and settings as separate pages.",
      workspace:
        "home",
      tip:
        "You can restart this tutorial from the Tutorial button in the header.",
    },
  ];

export function NexusPrimaryTutorial({
  onWorkspaceChange,
}: Props) {
  const [
    visible,
    setVisible,
  ] = useState(
    false,
  );

  const [
    step,
    setStep,
  ] = useState(
    0,
  );

  useEffect(
    () => {
      const start =
        () => {
          setStep(
            0,
          );

          setVisible(
            true,
          );

          onWorkspaceChange(
            steps[0]
              .workspace,
          );
        };

      window.addEventListener(
        "nexus:start-tutorial",
        start,
      );

      if (
        localStorage.getItem(
          KEY,
        ) !==
        "true"
      ) {
        start();
      }

      return () =>
        window.removeEventListener(
          "nexus:start-tutorial",
          start,
        );
    },
    [
      onWorkspaceChange,
    ],
  );

  if (!visible) {
    return null;
  }

  const current =
    steps[step];

  const move =
    (
      index:
        number,
    ) => {
      setStep(
        index,
      );

      onWorkspaceChange(
        steps[index]
          .workspace,
      );
    };

  const finish =
    () => {
      localStorage.setItem(
        KEY,
        "true",
      );

      setVisible(
        false,
      );
    };

  return (
    <div className="nexus-primary-tutorial-backdrop">
      <section className="nexus-primary-tutorial-card">
        <div className="top">
          <span>
            NEXUS ECU TUTORIAL
          </span>

          <button
            type="button"
            aria-label="Close tutorial"
            onClick={
              finish
            }
          >
            <X
              size={14}
            />
          </button>
        </div>

        <div
          className="progress"
          style={{
            gridTemplateColumns:
              `repeat(${steps.length}, 1fr)`,
          }}
        >
          {steps.map(
            (
              _,
              index,
            ) => (
              <span
                key={
                  index
                }
                className={
                  index <=
                  step
                    ? "active"
                    : ""
                }
              />
            ),
          )}
        </div>

        <strong className="count">
          STEP{" "}
          {step + 1}{" "}
          OF{" "}
          {steps.length}
        </strong>

        <h2>
          {current.title}
        </h2>

        <p>
          {current.detail}
        </p>

        {current.tip && (
          <div className="tutorial-tip">
            <span>
              TIP
            </span>

            <strong>
              {current.tip}
            </strong>
          </div>
        )}

        <div className="actions">
          <button
            type="button"
            disabled={
              step ===
              0
            }
            onClick={() =>
              move(
                step - 1,
              )
            }
          >
            <ArrowLeft
              size={12}
            />

            BACK
          </button>

          {step ===
          steps.length -
            1 ? (
            <button
              type="button"
              className="primary"
              onClick={
                finish
              }
            >
              <CheckCircle2
                size={12}
              />

              FINISH
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              onClick={() =>
                move(
                  step + 1,
                )
              }
            >
              NEXT

              <ArrowRight
                size={12}
              />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
