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
  NexusWorkspaceKey,
} from "./NexusWorkspaceShell";

import "./nexus-tutorial.css";

type Props = {
  onWorkspaceChange: (
    workspace:
      NexusWorkspaceKey,
  ) => void;
};

const TUTORIAL_KEY =
  "nexus.tutorial.v10.1.complete";

const steps:
  Array<{
    title:
      string;

    detail:
      string;

    workspace:
      NexusWorkspaceKey;
  }> = [
    {
      title:
        "Welcome to NEXUS ECU",
      detail:
        "NEXUS is now split into workspaces so you do not need to scroll through the entire application. Use the navigation on the left to move between major jobs.",
      workspace:
        "home",
    },
    {
      title:
        "Projects",
      detail:
        "Create a vehicle project before working with an ECU. Project files keep vehicle identity, ROM backups, restore points and session history together.",
      workspace:
        "project",
    },
    {
      title:
        "Hardware",
      detail:
        "Choose the adapter/provider, COM port or J2534 device here. NEXUS starts in read-only mode and does not reconnect silently.",
      workspace:
        "hardware",
    },
    {
      title:
        "ECU",
      detail:
        "Use this workspace for ECU detection, identity evidence, definition matching, ROM context and calibration binding.",
      workspace:
        "ecu",
    },
    {
      title:
        "Diagnostics",
      detail:
        "Transport faults, CAN problems, preflight blockers and recovery guidance are collected in one place.",
      workspace:
        "diagnostics",
    },
    {
      title:
        "Tuning",
      detail:
        "Calibration maps and tuning tools live here, separated from hardware setup so the interface stays focused.",
      workspace:
        "tuning",
    },
    {
      title:
        "Logging",
      detail:
        "Record and review telemetry, markers and live-data sessions without mixing them into the ECU setup screen.",
      workspace:
        "logging",
    },
    {
      title:
        "Safety",
      detail:
        "Compatibility, preflight, binding and production safety gates determine whether a workflow is ready, cautionary or blocked.",
      workspace:
        "safety",
    },
    {
      title:
        "You're ready",
      detail:
        "You can restart this tutorial any time from the Tutorial button in the navigation sidebar.",
      workspace:
        "home",
    },
  ];

export function NexusTutorial({
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
            steps[0].workspace,
          );
        };

      window.addEventListener(
        "nexus:start-tutorial",
        start,
      );

      if (
        localStorage.getItem(
          TUTORIAL_KEY,
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
      next:
        number,
    ) => {
      setStep(
        next,
      );

      onWorkspaceChange(
        steps[next].workspace,
      );
    };

  const finish =
    () => {
      localStorage.setItem(
        TUTORIAL_KEY,
        "true",
      );

      setVisible(
        false,
      );
    };

  return (
    <div className="nexus-tutorial-backdrop">
      <section className="nexus-tutorial-card">
        <div className="nexus-tutorial-top">
          <span>
            NEXUS ECU TUTORIAL
          </span>

          <button
            type="button"
            onClick={
              finish
            }
          >
            <X size={14} />
          </button>
        </div>

        <div className="nexus-tutorial-progress">
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

        <strong className="nexus-tutorial-step-count">
          STEP {step + 1} OF {steps.length}
        </strong>

        <h2>
          {current.title}
        </h2>

        <p>
          {current.detail}
        </p>

        <div className="nexus-tutorial-actions">
          <button
            type="button"
            disabled={
              step ===
              0
            }
            onClick={() =>
              move(
                step -
                1,
              )
            }
          >
            <ArrowLeft size={12} />
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
              <CheckCircle2 size={12} />
              FINISH
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              onClick={() =>
                move(
                  step +
                  1,
                )
              }
            >
              NEXT
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
