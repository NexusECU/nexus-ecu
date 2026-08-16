export type NexusAccessMode =
  | "read-only"
  | "advanced-diagnostic"
  | "programming";

export type NexusAccessSettings = {
  requestedMode:
    NexusAccessMode;

  programmingAcknowledged:
    boolean;
};

const STORAGE_KEY =
  "nexus.access-mode.v10.2";

const defaults:
  NexusAccessSettings = {
    requestedMode:
      "read-only",

    programmingAcknowledged:
      false,
  };

export function loadAccessSettings():
  NexusAccessSettings {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return defaults;
    }

    return {
      ...defaults,
      ...JSON.parse(
        raw,
      ),
    };
  } catch {
    return defaults;
  }
}

export function saveAccessSettings(
  settings:
    NexusAccessSettings,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      settings,
    ),
  );

  window.dispatchEvent(
    new CustomEvent(
      "nexus:access-settings",
      {
        detail:
          settings,
      },
    ),
  );
}
