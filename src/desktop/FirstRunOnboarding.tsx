import {
  CheckCircle2,
  FolderOpen,
  HardDrive,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import "./first-run-onboarding.css";

const ONBOARDING_KEY =
  "nexus.onboarding.v10.complete";

export function FirstRunOnboarding() {
  const [
    visible,
    setVisible,
  ] = useState(
    false,
  );

  useEffect(
    () => {
      setVisible(
        localStorage.getItem(
          ONBOARDING_KEY,
        ) !==
        "true",
      );
    },
    [],
  );

  if (!visible) {
    return null;
  }

  const complete =
    () => {
      localStorage.setItem(
        ONBOARDING_KEY,
        "true",
      );

      setVisible(
        false,
      );
    };

  return (
    <div className="first-run-onboarding-backdrop">
      <section className="first-run-onboarding">
        <span className="eyebrow">
          NEXUS ECU
        </span>

        <h2>
          Production Baseline Setup
        </h2>

        <p>
          NEXUS starts in read-only hardware mode. Create or
          open a vehicle project, verify project storage, then
          connect a supported adapter when you are ready to
          collect live ECU evidence.
        </p>

        <div className="first-run-onboarding-grid">
          <Step
            icon={
              <FolderOpen size={15} />
            }
            title="1. Create a Vehicle Project"
            detail="Keep vehicle identity, sessions, ROM metadata and restore points grouped together."
          />

          <Step
            icon={
              <HardDrive size={15} />
            }
            title="2. Verify Project Storage"
            detail="NEXUS stores project manifests, restore points and ROM backups under the application data directory."
          />

          <Step
            icon={
              <Wrench size={15} />
            }
            title="3. Select Supported Hardware"
            detail="Choose a supported read-only provider and explicitly connect it."
          />

          <Step
            icon={
              <ShieldCheck size={15} />
            }
            title="4. Follow Safety Gates"
            detail="Compatibility, preflight, calibration binding and diagnostics determine whether a workflow is allowed."
          />
        </div>

        <button
          type="button"
          onClick={
            complete
          }
        >
          <CheckCircle2 size={13} />
          CONTINUE TO NEXUS ECU
        </button>
      </section>
    </div>
  );
}

function Step({
  icon,
  title,
  detail,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  detail:
    string;
}) {
  return (
    <div className="first-run-onboarding-step">
      <div>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
