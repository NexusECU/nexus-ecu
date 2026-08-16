import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  loadExperienceSettings,
  type NexusExperienceSettings,
} from "./experienceSettings";

import "./simple-mode-helper.css";

type Props = {
  title:
    string;

  explanation:
    string;

  nextAction?:
    string;

  advanced?:
    React.ReactNode;
};

export function SimpleModeHelper({
  title,
  explanation,
  nextAction,
  advanced,
}: Props) {
  const [
    settings,
    setSettings,
  ] = useState<
    NexusExperienceSettings
  >(
    () =>
      loadExperienceSettings(),
  );

  const [
    advancedOpen,
    setAdvancedOpen,
  ] = useState(
    false,
  );

  useEffect(
    () => {
      const update =
        (
          event:
            Event,
        ) => {
          const custom =
            event as CustomEvent<
              NexusExperienceSettings
            >;

          setSettings(
            custom.detail,
          );
        };

      window.addEventListener(
        "nexus:experience-settings",
        update,
      );

      return () =>
        window.removeEventListener(
          "nexus:experience-settings",
          update,
        );
    },
    [],
  );

  if (
    settings.mode !==
    "simplified"
  ) {
    return (
      <>
        {advanced}
      </>
    );
  }

  return (
    <aside className="simple-mode-helper">
      <div className="simple-mode-helper-title">
        <Lightbulb
          size={13}
        />

        <strong>
          {title}
        </strong>
      </div>

      {settings.showExplanations && (
        <p>
          {explanation}
        </p>
      )}

      {settings.showRecommendedActions &&
        nextAction && (
          <div className="simple-mode-next">
            <span>
              NEXT
            </span>

            <strong>
              {nextAction}
            </strong>
          </div>
        )}

      {advanced &&
        settings.reduceAdvancedDetail && (
          <>
            <button
              type="button"
              onClick={() =>
                setAdvancedOpen(
                  value =>
                    !value,
                )
              }
            >
              {advancedOpen ? (
                <ChevronUp
                  size={11}
                />
              ) : (
                <ChevronDown
                  size={11}
                />
              )}

              {advancedOpen
                ? "HIDE ADVANCED"
                : "SHOW ADVANCED"}
            </button>

            {advancedOpen &&
              advanced}
          </>
        )}

      {advanced &&
        !settings.reduceAdvancedDetail &&
        advanced}
    </aside>
  );
}
