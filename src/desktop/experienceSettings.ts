export type NexusExperienceMode =
  | "simplified"
  | "advanced";

export type NexusExperienceSettings = {
  mode:
    NexusExperienceMode;

  showExplanations:
    boolean;

  showRecommendedActions:
    boolean;

  reduceAdvancedDetail:
    boolean;
};

const STORAGE_KEY =
  "nexus.experience.v10.1";

const defaults:
  NexusExperienceSettings = {
    mode:
      "advanced",

    showExplanations:
      true,

    showRecommendedActions:
      true,

    reduceAdvancedDetail:
      false,
  };

export function loadExperienceSettings():
  NexusExperienceSettings {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return defaults;
    }

    const parsed =
      JSON.parse(
        raw,
      );

    // migrate older Simple Mode values automatically
    if (
      parsed.mode ===
      "simple"
    ) {
      parsed.mode =
        "simplified";
    }

    if (
      parsed.mode ===
      "standard"
    ) {
      parsed.mode =
        "advanced";
    }

    return {
      ...defaults,
      ...parsed,
    };
  } catch {
    return defaults;
  }
}

export function saveExperienceSettings(
  settings:
    NexusExperienceSettings,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      settings,
    ),
  );

  document.documentElement.dataset.nexusViewMode =
    settings.mode;

  window.dispatchEvent(
    new CustomEvent(
      "nexus:experience-settings",
      {
        detail:
          settings,
      },
    ),
  );
}

export function applyExperienceMode():
  void {
  const settings =
    loadExperienceSettings();

  document.documentElement.dataset.nexusViewMode =
    settings.mode;
}
