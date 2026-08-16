import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import nexusLogo from "../assets/nexus-logo.png";

import {
  Activity,
  BookOpen,
  CarFront,
  CircleHelp,
  Cpu,
  Gauge,
  Home,
  Info,
  Keyboard,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";

import {
  isTauri,
} from "@tauri-apps/api/core";

import {
  Menu,
} from "@tauri-apps/api/menu";

import {
  getCurrentWindow,
} from "@tauri-apps/api/window";

import {
  confirm,
} from "@tauri-apps/plugin-dialog";

import {
  APP_VERSION,
} from "../version";

import {
  loadDesktopSettings,
  saveDesktopSettings,
  type DesktopSettings,
  type DesktopWorkspace,
} from "./desktopSettings";

import "./desktop-shell.css";

export type NexusHeaderWorkspace =
  | "home"
  | "project"
  | "hardware"
  | "ecu"
  | "diagnostics"
  | "tuning"
  | "logging"
  | "safety"
  | "settings";

type DesktopShellProps = {
  dirty: boolean;

  projectName: string;

  projectPath:
    string | null;

  onNew: () => void;

  onOpen: () =>
    void | Promise<void>;

  onSave: () =>
    void | Promise<void>;

  onSaveAs: () =>
    void | Promise<void>;

  onWorkspace: (
    workspace:
      DesktopWorkspace,
  ) => void;

  onSettingsChanged?: (
    settings:
      DesktopSettings,
  ) => void;

  activeHeaderWorkspace:
    NexusHeaderWorkspace;

  onHeaderWorkspace: (
    workspace:
      NexusHeaderWorkspace,
  ) => void;

  simplifiedMode?:
    boolean;
};

export function DesktopShell({
  dirty,
  projectName,
  projectPath,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onWorkspace,
  onSettingsChanged,
  activeHeaderWorkspace,
  onHeaderWorkspace,
  simplifiedMode = false,
}: DesktopShellProps) {
  const [
    settings,
    setSettings,
  ] = useState<DesktopSettings>(
    () =>
      loadDesktopSettings(),
  );

  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [
    aboutOpen,
    setAboutOpen,
  ] = useState(false);

  const [
    startupSplashVisible,
    setStartupSplashVisible,
  ] = useState(true);

  const desktop =
    isTauri();


  /*
   * App.tsx updates ECU telemetry very frequently.
   * Keep native desktop callbacks in refs so Tauri
   * menus/listeners are not torn down and rebuilt
   * on every React render.
   */
  const onNewRef =
    useRef(
      onNew,
    );

  const onOpenRef =
    useRef(
      onOpen,
    );

  const onSaveRef =
    useRef(
      onSave,
    );

  const onSaveAsRef =
    useRef(
      onSaveAs,
    );

  const onWorkspaceRef =
    useRef(
      onWorkspace,
    );

  onNewRef.current =
    onNew;

  onOpenRef.current =
    onOpen;

  onSaveRef.current =
    onSave;

  onSaveAsRef.current =
    onSaveAs;

  onWorkspaceRef.current =
    onWorkspace;

  const updateSettings = (
    next:
      DesktopSettings,
  ) => {
    setSettings(
      next,
    );

    saveDesktopSettings(
      next,
    );

    onSettingsChanged?.(
      next,
    );
  };

  useEffect(() => {
    onSettingsChanged?.(
      settings,
    );
  }, []);

  useEffect(() => {
    const keyHandler = (
      event:
        KeyboardEvent,
    ) => {
      const modifier =
        event.ctrlKey ||
        event.metaKey;

      if (!modifier) {
        return;
      }

      const key =
        event.key.toLowerCase();

      if (
        key === "s" &&
        event.shiftKey
      ) {
        event.preventDefault();
        void onSaveAsRef.current();
        return;
      }

      if (
        key === "s"
      ) {
        event.preventDefault();
        void onSaveRef.current();
        return;
      }

      if (
        key === "o"
      ) {
        event.preventDefault();
        void onOpenRef.current();
        return;
      }

      if (
        key === "n"
      ) {
        event.preventDefault();

        if (
          activeHeaderWorkspace !==
          "project"
        ) {
          onHeaderWorkspace(
            "project",
          );
          return;
        }

        onNewRef.current();
        return;
      }

      if (
        key === ","
      ) {
        event.preventDefault();
        setSettingsOpen(
          true,
        );
      }
    };

    window.addEventListener(
      "keydown",
      keyHandler,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        keyHandler,
      );
    };
  }, []);

  useEffect(() => {
    if (
      !settings.autosaveEnabled ||
      !dirty
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void onSaveRef.current();
        },
        settings
          .autosaveIntervalSeconds *
          1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    dirty,
    settings.autosaveEnabled,
    settings
      .autosaveIntervalSeconds,
  ]);

  useEffect(() => {
    const beforeUnload = (
      event:
        BeforeUnloadEvent,
    ) => {
      if (
        dirty &&
        settings
          .confirmBeforeClose
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener(
      "beforeunload",
      beforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        beforeUnload,
      );
    };
  }, [
    dirty,
    settings
      .confirmBeforeClose,
  ]);

  useEffect(() => {
    if (!desktop) {
      return;
    }

    let disposed =
      false;

    let unlisten:
      (() => void) |
      undefined;

    const setupCloseGuard =
      async () => {
        unlisten =
          await getCurrentWindow()
            .onCloseRequested(
              async (
                event,
              ) => {
                if (
                  !dirty ||
                  !settings
                    .confirmBeforeClose
                ) {
                  return;
                }

                const approved =
                  await confirm(
                    `Save changes to "${projectName}" before closing? Unsaved changes will be lost if you continue.`,
                    {
                      title:
                        "NEXUS ECU",
                      kind:
                        "warning",
                      okLabel:
                        "Close Anyway",
                      cancelLabel:
                        "Cancel",
                    },
                  );

                if (
                  !approved
                ) {
                  event.preventDefault();
                }
              },
            );
      };

    void setupCloseGuard();

    return () => {
      disposed =
        true;

      if (
        !disposed
      ) {
        return;
      }

      unlisten?.();
    };
  }, [
    desktop,
    dirty,
    projectName,
    settings
      .confirmBeforeClose,
  ]);

  useEffect(() => {
    if (!desktop) {
      return;
    }

    let menu:
      Menu | null =
      null;

    const buildMenu =
      async () => {
        menu =
          await Menu.new({
            items: [
              {
                text:
                  "File",

                items: [
                  {
                    id:
                      "new-project",
                    text:
                      "New Project",
                    accelerator:
                      "Ctrl+N",
                    action:
                      () => {
                        if (
                          activeHeaderWorkspace !==
                          "project"
                        ) {
                          onHeaderWorkspace(
                            "project",
                          );
                          return;
                        }

                        onNewRef.current();
                      },
                  },
                  {
                    id:
                      "open-project",
                    text:
                      "Open Project…",
                    accelerator:
                      "Ctrl+O",
                    action:
                      () =>
                        void onOpenRef.current(),
                  },
                  {
                    id:
                      "save-project",
                    text:
                      "Save",
                    accelerator:
                      "Ctrl+S",
                    action:
                      () =>
                        void onSaveRef.current(),
                  },
                  {
                    id:
                      "save-project-as",
                    text:
                      "Save As…",
                    accelerator:
                      "Ctrl+Shift+S",
                    action:
                      () =>
                        void onSaveAsRef.current(),
                  },
                ],
              },
              {
                text:
                  "Workspace",

                items: [
                  {
                    text:
                      "Overview",
                    action:
                      () =>
                        onWorkspaceRef.current(
                          "overview",
                        ),
                  },
                  {
                    text:
                      "Performance",
                    action:
                      () =>
                        onWorkspaceRef.current(
                          "performance",
                        ),
                  },
                  {
                    text:
                      "Tuning",
                    action:
                      () =>
                        onWorkspaceRef.current(
                          "tuning",
                        ),
                  },
                  {
                    text:
                      "Diagnostics",
                    action:
                      () =>
                        onWorkspaceRef.current(
                          "diagnostics",
                        ),
                  },
                  {
                    text:
                      "Setup",
                    action:
                      () =>
                        onWorkspaceRef.current(
                          "setup",
                        ),
                  },
                ],
              },
              {
                text:
                  "NEXUS ECU",

                items: [
                  {
                    text:
                      "Preferences…",
                    accelerator:
                      "Ctrl+,",
                    action:
                      () =>
                        setSettingsOpen(
                          true,
                        ),
                  },
                  {
                    text:
                      "About NEXUS ECU",
                    action:
                      () =>
                        setAboutOpen(
                          true,
                        ),
                  },
                ],
              },
            ],
          });

        await menu
          .setAsAppMenu();
      };

    void buildMenu();

    return () => {
      void menu?.close();
    };
  }, [
    desktop,
  ]);


  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setStartupSplashVisible(
            false,
          );
        },
        1400,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);


  const headerTabs:
    Array<{
      key:
        NexusHeaderWorkspace;

      label:
        string;

      icon:
        React.ReactNode;
    }> = [
      {
        key:
          "home",
        label:
          "Home",
        icon:
          <Home size={12} />,
      },
      {
        key:
          "project",
        label:
          "Project",
        icon:
          <CarFront size={12} />,
      },
      {
        key:
          "hardware",
        label:
          "Hardware",
        icon:
          <Wrench size={12} />,
      },
      {
        key:
          "ecu",
        label:
          "ECU",
        icon:
          <Cpu size={12} />,
      },
      {
        key:
          "diagnostics",
        label:
          "Diagnostics",
        icon:
          <Activity size={12} />,
      },
      {
        key:
          "tuning",
        label:
          "Tuning",
        icon:
          <SlidersHorizontal size={12} />,
      },
      {
        key:
          "logging",
        label:
          "Logging",
        icon:
          <Gauge size={12} />,
      },
      {
        key:
          "safety",
        label:
          "Safety",
        icon:
          <ShieldCheck size={12} />,
      },
      {
        key:
          "settings",
        label:
          "Settings",
        icon:
          <CircleHelp size={12} />,
      },
    ];

  const visibleHeaderTabs =
    simplifiedMode
      ? headerTabs.filter(
          tab =>
            [
              "home",
              "project",
              "hardware",
              "diagnostics",
              "logging",
              "settings",
            ].includes(
              tab.key,
            ),
        )
      : headerTabs;

  const autosaveText =
    useMemo(
      () =>
        settings
          .autosaveEnabled
          ? `AUTOSAVE ${settings.autosaveIntervalSeconds}s`
          : "AUTOSAVE OFF",
      [
        settings,
      ],
    );

  return (
    <>
      {startupSplashVisible && (
        <div className="desktop-startup-splash">
          <div className="desktop-startup-splash-inner">
            <img
              src={nexusLogo}
              alt="NEXUS ECU"
            />

            <h1>
              NEXUS ECU
            </h1>

            <div className="desktop-startup-subtitle">
              ENGINE MANAGEMENT PLATFORM
            </div>

            <div className="desktop-startup-loader">
              <div />
            </div>

            <div className="desktop-startup-version">
              DESKTOP APPLICATION · v{APP_VERSION}
            </div>
          </div>
        </div>
      )}

      <div
        className={`desktop-status-strip ${
          settings
            .compactProjectBar
            ? "compact"
            : ""
        }`}
      >
        <div className="desktop-status-brand">
          <Cpu
            size={13}
          />

          <strong>
            NEXUS ECU
          </strong>

          <span>
            v{APP_VERSION}
          </span>
        </div>

        <nav className="desktop-workspace-tabs">
          {visibleHeaderTabs.map(
            tab => (
              <button
                type="button"
                key={
                  tab.key
                }
                className={
                  activeHeaderWorkspace ===
                  tab.key
                    ? "active"
                    : ""
                }
                onClick={() => {
                  onHeaderWorkspace(
                    tab.key,
                  );
                }}
              >
                {tab.icon}

                <span>
                  {tab.label}
                </span>
              </button>
            ),
          )}
        </nav>

        <div className="desktop-status-right">
          <span>
            {autosaveText}
          </span>

          <span>
            {dirty
              ? "UNSAVED CHANGES"
              : "PROJECT SAVED"}
          </span>

          <button
            type="button"
            className="desktop-tutorial-button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(
                  "nexus:start-tutorial",
                ),
              )
            }
          >
            <BookOpen
              size={12}
            />

            TUTORIAL
          </button>

          <button
            type="button"
            onClick={() =>
              setAboutOpen(
                true,
              )
            }
          >
            <Info
              size={13}
            />

            ABOUT
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="desktop-modal-backdrop">
          <div className="desktop-modal">
            <div className="desktop-modal-header">
              <div>
                <span className="eyebrow">
                  APPLICATION
                </span>

                <h2>
                  Application Settings
                </h2>
              </div>

              <button
                type="button"
                className="desktop-icon-button"
                onClick={() =>
                  setSettingsOpen(
                    false,
                  )
                }
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div className="desktop-settings-grid">
              <SettingToggle
                label="AUTOSAVE"
                description="Automatically save the active project while changes are pending."
                checked={
                  settings
                    .autosaveEnabled
                }
                onChange={(
                  checked,
                ) =>
                  updateSettings({
                    ...settings,
                    autosaveEnabled:
                      checked,
                  })
                }
              />

              <SettingToggle
                label="CONFIRM BEFORE CLOSE"
                description="Warn when the application is closed with unsaved project changes."
                checked={
                  settings
                    .confirmBeforeClose
                }
                onChange={(
                  checked,
                ) =>
                  updateSettings({
                    ...settings,
                    confirmBeforeClose:
                      checked,
                  })
                }
              />

              <SettingToggle
                label="COMPACT PROJECT BAR"
                description="Reduce the height of the desktop status strip."
                checked={
                  settings
                    .compactProjectBar
                }
                onChange={(
                  checked,
                ) =>
                  updateSettings({
                    ...settings,
                    compactProjectBar:
                      checked,
                  })
                }
              />

              <label className="desktop-setting-field">
                <span>
                  AUTOSAVE INTERVAL
                </span>

                <small>
                  Seconds between automatic project saves.
                </small>

                <input
                  type="number"
                  min={15}
                  max={900}
                  value={
                    settings
                      .autosaveIntervalSeconds
                  }
                  onChange={(
                    event,
                  ) =>
                    updateSettings({
                      ...settings,

                      autosaveIntervalSeconds:
                        Math.max(
                          15,
                          Math.min(
                            900,
                            Number(
                              event
                                .target
                                .value,
                            ),
                          ),
                        ),
                    })
                  }
                />
              </label>

              <label className="desktop-setting-field">
                <span>
                  DEFAULT WORKSPACE
                </span>

                <small>
                  Workspace selected when NEXUS ECU starts.
                </small>

                <select
                  value={
                    settings
                      .defaultWorkspace
                  }
                  onChange={(
                    event,
                  ) =>
                    updateSettings({
                      ...settings,

                      defaultWorkspace:
                        event
                          .target
                          .value as
                          DesktopWorkspace,
                    })
                  }
                >
                  <option value="overview">
                    Overview
                  </option>

                  <option value="performance">
                    Performance
                  </option>

                  <option value="tuning">
                    Tuning
                  </option>

                  <option value="diagnostics">
                    Diagnostics
                  </option>

                  <option value="setup">
                    Setup
                  </option>
                </select>
              </label>
            </div>

            <div className="desktop-shortcuts">
              <div>
                <Keyboard
                  size={15}
                />

                <strong>
                  KEYBOARD SHORTCUTS
                </strong>
              </div>

              <span>
                Ctrl+N New
              </span>

              <span>
                Ctrl+O Open
              </span>

              <span>
                Ctrl+S Save
              </span>

              <span>
                Ctrl+Shift+S Save As
              </span>

              <span>
                Ctrl+, Settings
              </span>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="desktop-modal-backdrop">
          <div className="desktop-modal about">
            <div className="desktop-modal-header">
              <div>
                <span className="eyebrow">
                  PRODUCT INFORMATION
                </span>

                <h2>
                  About NEXUS ECU
                </h2>
              </div>

              <button
                type="button"
                className="desktop-icon-button"
                onClick={() =>
                  setAboutOpen(
                    false,
                  )
                }
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div className="desktop-about-brand">
              <img
                src={nexusLogo}
                alt="NEXUS ECU"
              />

              <div>
                <h3>
                  NEXUS ECU
                </h3>

                <strong>
                  ENGINE MANAGEMENT PLATFORM
                </strong>

                <span>
                  Version {APP_VERSION}
                </span>
              </div>
            </div>

            <div className="desktop-about-grid">
              <div>
                <ShieldCheck
                  size={16}
                />

                <span>
                  RELEASE
                </span>

                <strong>
                  DESKTOP
                </strong>
              </div>

              <div>
                <Save
                  size={16}
                />

                <span>
                  PROJECT
                </span>

                <strong>
                  {projectName}
                </strong>
              </div>

              <div>
                <CircleHelp
                  size={16}
                />

                <span>
                  PROJECT FILE
                </span>

                <strong>
                  {projectPath ??
                    "UNSAVED"}
                </strong>
              </div>
            </div>

            <p className="desktop-about-copy">
              NEXUS ECU is a desktop engine-management,
              calibration, data-analysis and ECU development
              platform. The current hardware interface remains
              simulation-based; project, calibration and desktop
              workflow features are production software features.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;

  description: string;

  checked: boolean;

  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <label className="desktop-setting-toggle">
      <div>
        <span>
          {label}
        </span>

        <small>
          {description}
        </small>
      </div>

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event,
        ) =>
          onChange(
            event
              .target
              .checked,
          )
        }
      />
    </label>
  );
}
