import {
  BookOpen,
  Gauge,
  Keyboard,
  MonitorCog,
  Save,
  Settings,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

import {
  SimpleModeSettingsPanel,
} from "./SimpleModeSettingsPanel";

import {
  AccessModeSettingsPanel,
} from "./AccessModeSettingsPanel";

import "./nexus-settings-workspace.css";

export function NexusSettingsWorkspace() {
  return (
    <div className="nexus-settings-page">
      <section className="nexus-settings-hero">
        <div className="nexus-settings-hero-icon">
          <Settings size={20} />
        </div>

        <div>
          <span className="eyebrow">
            NEXUS ECU SETTINGS
          </span>

          <h1>
            Preferences & Access
          </h1>

          <p>
            Control how NEXUS looks, how much technical detail it shows,
            and the maximum ECU access level it may request.
          </p>
        </div>
      </section>

      <div className="nexus-settings-grid">
        <section className="nexus-settings-card nexus-settings-card-wide">
          <div className="nexus-settings-card-title">
            <MonitorCog size={17} />

            <div>
              <span className="eyebrow">
                INTERFACE
              </span>

              <h2>
                View Mode
              </h2>

              <p>
                Switch between a cleaner beginner-focused interface and
                the full technical NEXUS experience.
              </p>
            </div>
          </div>

          <SimpleModeSettingsPanel />
        </section>

        <section className="nexus-settings-card nexus-settings-card-wide">
          <div className="nexus-settings-card-title">
            <Wrench size={17} />

            <div>
              <span className="eyebrow">
                ECU ACCESS
              </span>

              <h2>
                Operating Access Mode
              </h2>

              <p>
                Choose the highest access level NEXUS may request.
                Safety and compatibility gates can still reduce it.
              </p>
            </div>
          </div>

          <AccessModeSettingsPanel />
        </section>

        <section className="nexus-settings-card">
          <div className="nexus-settings-card-title">
            <Save size={17} />

            <div>
              <span className="eyebrow">
                APPLICATION
              </span>

              <h2>
                Project Behaviour
              </h2>
            </div>
          </div>

          <div className="nexus-settings-summary-list">
            <SettingSummary
              label="Autosave"
              detail="Automatically save pending project changes."
            />

            <SettingSummary
              label="Confirm Before Close"
              detail="Warn before closing with unsaved project changes."
            />

            <SettingSummary
              label="Autosave Interval"
              detail="Controls how often the active project is saved."
            />

            <SettingSummary
              label="Default Workspace"
              detail="Choose which workspace NEXUS starts on."
            />
          </div>

          <div className="nexus-settings-hint">
            These desktop application controls remain available through
            <strong> Ctrl+, </strong>
            while the Settings page handles NEXUS preferences.
          </div>
        </section>

        <section className="nexus-settings-card">
          <div className="nexus-settings-card-title">
            <SlidersHorizontal size={17} />

            <div>
              <span className="eyebrow">
                WORKFLOW
              </span>

              <h2>
                Project Rules
              </h2>
            </div>
          </div>

          <div className="nexus-settings-summary-list">
            <SettingSummary
              label="Project Creation"
              detail="New projects can only be created from the Project page."
            />

            <SettingSummary
              label="Hardware Page"
              detail="Hardware automatically opens in Live ECU mode."
            />

            <SettingSummary
              label="Safety Gates"
              detail="Higher-risk workflows stay blocked until requirements pass."
            />
          </div>
        </section>

        <section className="nexus-settings-card">
          <div className="nexus-settings-card-title">
            <Keyboard size={17} />

            <div>
              <span className="eyebrow">
                SHORTCUTS
              </span>

              <h2>
                Keyboard
              </h2>
            </div>
          </div>

          <div className="nexus-shortcut-grid">
            <Shortcut
              keys="Ctrl+N"
              label="Go to Project / New Project"
            />

            <Shortcut
              keys="Ctrl+O"
              label="Open Project"
            />

            <Shortcut
              keys="Ctrl+S"
              label="Save"
            />

            <Shortcut
              keys="Ctrl+Shift+S"
              label="Save As"
            />

            <Shortcut
              keys="Ctrl+,"
              label="Application Settings"
            />
          </div>
        </section>

        <section className="nexus-settings-card">
          <div className="nexus-settings-card-title">
            <BookOpen size={17} />

            <div>
              <span className="eyebrow">
                HELP
              </span>

              <h2>
                Tutorial
              </h2>
            </div>
          </div>

          <p className="nexus-settings-help-text">
            Restart the guided NEXUS walkthrough whenever you want a refresher
            on Projects, Hardware, ECU, Diagnostics, Tuning, Logging and Safety.
          </p>

          <button
            type="button"
            className="nexus-settings-tutorial-button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(
                  "nexus:start-tutorial",
                ),
              )
            }
          >
            <BookOpen size={13} />
            RESTART TUTORIAL
          </button>
        </section>
      </div>
    </div>
  );
}

function SettingSummary({
  label,
  detail,
}: {
  label:
    string;

  detail:
    string;
}) {
  return (
    <div className="nexus-setting-summary">
      <Gauge size={12} />

      <div>
        <strong>
          {label}
        </strong>

        <span>
          {detail}
        </span>
      </div>
    </div>
  );
}

function Shortcut({
  keys,
  label,
}: {
  keys:
    string;

  label:
    string;
}) {
  return (
    <div className="nexus-shortcut-row">
      <kbd>
        {keys}
      </kbd>

      <span>
        {label}
      </span>
    </div>
  );
}
