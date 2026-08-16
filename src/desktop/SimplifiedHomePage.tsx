import {
  Activity,
  FolderOpen,
  Gauge,
  Settings,
  Usb,
} from "lucide-react";

import "./simplified-mode.css";

type Props = {
  onOpenProject:
    () => void;

  onOpenHardware:
    () => void;

  onOpenDiagnostics:
    () => void;

  onOpenLogging:
    () => void;

  onOpenSettings:
    () => void;
};

export function SimplifiedHomePage({
  onOpenProject,
  onOpenHardware,
  onOpenDiagnostics,
  onOpenLogging,
  onOpenSettings,
}: Props) {
  return (
    <div className="nexus-simple-page">
      <section className="nexus-simple-hero">
        <span className="eyebrow">
          SIMPLIFIED VIEW
        </span>

        <h1>
          What do you want to do?
        </h1>

        <p>
          Choose an action below. NEXUS will take you to the
          right page and keep the technical details to a minimum.
        </p>
      </section>

      <div className="nexus-simple-actions">
        <SimpleAction
          icon={
            <FolderOpen
              size={22}
            />
          }
          title="Open or Create a Project"
          detail="Start with your vehicle and tune project."
          onClick={
            onOpenProject
          }
        />

        <SimpleAction
          icon={
            <Usb
              size={22}
            />
          }
          title="Connect to a Vehicle"
          detail="Open the live hardware connection page."
          onClick={
            onOpenHardware
          }
        />

        <SimpleAction
          icon={
            <Activity
              size={22}
            />
          }
          title="Check Diagnostics"
          detail="Review ECU and connection health."
          onClick={
            onOpenDiagnostics
          }
        />

        <SimpleAction
          icon={
            <Gauge
              size={22}
            />
          }
          title="Record Data"
          detail="Open the logging workspace."
          onClick={
            onOpenLogging
          }
        />

        <SimpleAction
          icon={
            <Settings
              size={22}
            />
          }
          title="Settings"
          detail="Switch back to Advanced View at any time."
          onClick={
            onOpenSettings
          }
        />
      </div>

      <section className="nexus-simple-guide">
        <strong>
          Recommended order
        </strong>

        <div>
          <span>1</span>
          Create or open a Project
        </div>

        <div>
          <span>2</span>
          Connect Hardware
        </div>

        <div>
          <span>3</span>
          Check Diagnostics
        </div>

        <div>
          <span>4</span>
          Record Data or continue with guided actions
        </div>
      </section>
    </div>
  );
}

function SimpleAction({
  icon,
  title,
  detail,
  onClick,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  detail:
    string;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      className="nexus-simple-action"
      onClick={
        onClick
      }
    >
      <span className="nexus-simple-action-icon">
        {icon}
      </span>

      <span>
        <strong>
          {title}
        </strong>

        <em>
          {detail}
        </em>
      </span>
    </button>
  );
}
