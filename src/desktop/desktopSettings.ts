export type DesktopWorkspace =
  | "overview"
  | "performance"
  | "tuning"
  | "diagnostics"
  | "setup";

export type DesktopSettings = {
  autosaveEnabled: boolean;

  autosaveIntervalSeconds: number;

  confirmBeforeClose: boolean;

  defaultWorkspace:
    DesktopWorkspace;

  compactProjectBar: boolean;
};

export const defaultDesktopSettings:
  DesktopSettings = {
    autosaveEnabled: true,

    autosaveIntervalSeconds:
      60,

    confirmBeforeClose:
      true,

    defaultWorkspace:
      "overview",

    compactProjectBar:
      false,
  };

const SETTINGS_KEY =
  "nexus-ecu-desktop-settings-v1";

export function loadDesktopSettings():
  DesktopSettings {
  try {
    const raw =
      localStorage.getItem(
        SETTINGS_KEY,
      );

    if (!raw) {
      return {
        ...defaultDesktopSettings,
      };
    }

    const parsed =
      JSON.parse(
        raw,
      ) as
        Partial<DesktopSettings>;

    return {
      ...defaultDesktopSettings,
      ...parsed,

      autosaveIntervalSeconds:
        Math.max(
          15,
          Math.min(
            900,
            Number(
              parsed.autosaveIntervalSeconds ??
              defaultDesktopSettings
                .autosaveIntervalSeconds,
            ),
          ),
        ),
    };
  } catch {
    return {
      ...defaultDesktopSettings,
    };
  }
}

export function saveDesktopSettings(
  settings:
    DesktopSettings,
): void {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(
      settings,
    ),
  );
}
