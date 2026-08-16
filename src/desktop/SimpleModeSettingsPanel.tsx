import {
  Brain,
  CheckCircle2,
  Eye,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  loadExperienceSettings,
  saveExperienceSettings,
  type NexusExperienceMode,
  type NexusExperienceSettings,
} from "./experienceSettings";

import "./simple-mode-settings.css";

export function SimpleModeSettingsPanel() {
  const [
    settings,
    setSettings,
  ] = useState<
    NexusExperienceSettings
  >(
    () =>
      loadExperienceSettings(),
  );

  useEffect(
    () => {
      saveExperienceSettings(
        settings,
      );
    },
    [
      settings,
    ],
  );

  const setMode =
    (
      mode:
        NexusExperienceMode,
    ) => {
      setSettings(
        current => ({
          ...current,

          mode,

          showExplanations:
            mode ===
            "simplified",

          showRecommendedActions:
            true,

          reduceAdvancedDetail:
            mode ===
            "simplified",
        }),
      );
    };

  return (
    <section className="simple-mode-settings">
      <div className="simple-mode-header">
        <div>
          <Eye
            size={16}
          />

          <div>
            <span className="eyebrow">
              VIEW MODE
            </span>

            <h3>
              Interface Complexity
            </h3>

            <p>
              Switch between a beginner-friendly interface and
              the full technical NEXUS ECU experience.
            </p>
          </div>
        </div>
      </div>

      <div className="view-mode-selector">
        <button
          type="button"
          className={
            settings.mode ===
            "simplified"
              ? "active"
              : ""
          }
          onClick={() =>
            setMode(
              "simplified",
            )
          }
        >
          <Sparkles
            size={16}
          />

          <div>
            <strong>
              Simplified View
            </strong>

            <span>
              Plain-language guidance, recommended next steps,
              and less technical clutter.
            </span>
          </div>

          {settings.mode ===
            "simplified" && (
            <CheckCircle2
              size={15}
            />
          )}
        </button>

        <button
          type="button"
          className={
            settings.mode ===
            "advanced"
              ? "active"
              : ""
          }
          onClick={() =>
            setMode(
              "advanced",
            )
          }
        >
          <Brain
            size={16}
          />

          <div>
            <strong>
              Advanced View
            </strong>

            <span>
              Full protocol details, technical statuses, and
              advanced ECU information.
            </span>
          </div>

          {settings.mode ===
            "advanced" && (
            <CheckCircle2
              size={15}
            />
          )}
        </button>
      </div>

      {settings.mode ===
        "simplified" && (
        <div className="simple-mode-options">
          <Option
            icon={
              <Lightbulb
                size={13}
              />
            }
            title="Recommended next action"
            detail="Shows what NEXUS recommends doing next when a workflow is incomplete or blocked."
            checked={
              settings.showRecommendedActions
            }
            onChange={
              checked =>
                setSettings(
                  current => ({
                    ...current,

                    showRecommendedActions:
                      checked,
                  }),
                )
            }
          />

          <Option
            icon={
              <Eye
                size={13}
              />
            }
            title="Plain-language explanations"
            detail="Explains technical ECU terms using simpler wording."
            checked={
              settings.showExplanations
            }
            onChange={
              checked =>
                setSettings(
                  current => ({
                    ...current,

                    showExplanations:
                      checked,
                  }),
                )
            }
          />
        </div>
      )}

      <div className="simple-mode-note">
        View Mode changes presentation only. Compatibility,
        preflight, calibration binding, diagnostics, and safety
        gates work exactly the same in both modes.
      </div>
    </section>
  );
}

function Option({
  icon,
  title,
  detail,
  checked,
  onChange,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  detail:
    string;

  checked:
    boolean;

  onChange: (
    checked:
      boolean,
  ) => void;
}) {
  return (
    <label className="simple-mode-option">
      <span className="simple-mode-option-icon">
        {icon}
      </span>

      <span className="simple-mode-option-copy">
        <strong>
          {title}
        </strong>

        <em>
          {detail}
        </em>
      </span>

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={
          event =>
            onChange(
              event.target.checked,
            )
        }
      />
    </label>
  );
}
