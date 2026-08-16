import {
  Activity,
  BookOpen,
  CarFront,
  Cpu,
  Gauge,
  HardDrive,
  Home,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import "./nexus-workspace-shell.css";

export type NexusWorkspaceKey =
  | "home"
  | "project"
  | "hardware"
  | "ecu"
  | "diagnostics"
  | "tuning"
  | "logging"
  | "safety"
  | "settings";

type Props = {
  active:
    NexusWorkspaceKey;

  onChange: (
    workspace:
      NexusWorkspaceKey,
  ) => void;

  children:
    React.ReactNode;

  version:
    string;
};

const items:
  Array<{
    key:
      NexusWorkspaceKey;

    label:
      string;

    description:
      string;

    icon:
      React.ReactNode;
  }> = [
    {
      key:
        "home",
      label:
        "Home",
      description:
        "Overview",
      icon:
        <Home size={15} />,
    },
    {
      key:
        "project",
      label:
        "Project",
      description:
        "Vehicle & files",
      icon:
        <CarFront size={15} />,
    },
    {
      key:
        "hardware",
      label:
        "Hardware",
      description:
        "Adapters & CAN",
      icon:
        <Wrench size={15} />,
    },
    {
      key:
        "ecu",
      label:
        "ECU",
      description:
        "Identity & ROM",
      icon:
        <Cpu size={15} />,
    },
    {
      key:
        "diagnostics",
      label:
        "Diagnostics",
      description:
        "Health & recovery",
      icon:
        <Activity size={15} />,
    },
    {
      key:
        "tuning",
      label:
        "Tuning",
      description:
        "Maps & calibration",
      icon:
        <SlidersHorizontal size={15} />,
    },
    {
      key:
        "logging",
      label:
        "Logging",
      description:
        "Live data",
      icon:
        <Gauge size={15} />,
    },
    {
      key:
        "safety",
      label:
        "Safety",
      description:
        "Gates & readiness",
      icon:
        <ShieldCheck size={15} />,
    },
    {
      key:
        "settings",
      label:
        "Settings",
      description:
        "Application",
      icon:
        <Settings size={15} />,
    },
  ];

export function NexusWorkspaceShell({
  active,
  onChange,
  children,
  version,
}: Props) {
  const current =
    useMemo(
      () =>
        items.find(
          item =>
            item.key ===
            active,
        ) ??
        items[0],
      [
        active,
      ],
    );

  const [
    collapsed,
    setCollapsed,
  ] = useState(
    false,
  );

  return (
    <div
      className={`nexus-workspace-shell ${
        collapsed
          ? "collapsed"
          : ""
      }`}
    >
      <aside className="nexus-workspace-sidebar">
        <div className="nexus-workspace-brand">
          <HardDrive
            size={17}
          />

          {!collapsed && (
            <div>
              <strong>
                NEXUS ECU
              </strong>

              <span>
                v{version}
              </span>
            </div>
          )}
        </div>

        <nav>
          {items.map(
            item => (
              <button
                type="button"
                key={
                  item.key
                }
                className={
                  active ===
                  item.key
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onChange(
                    item.key,
                  )
                }
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
              >
                <span className="icon">
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="copy">
                    <strong>
                      {item.label}
                    </strong>

                    <em>
                      {item.description}
                    </em>
                  </span>
                )}
              </button>
            ),
          )}
        </nav>

        <div className="nexus-workspace-sidebar-footer">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(
                  "nexus:start-tutorial",
                ),
              )
            }
          >
            <BookOpen
              size={14}
            />

            {!collapsed &&
              "Tutorial"}
          </button>

          <button
            type="button"
            onClick={() =>
              setCollapsed(
                value =>
                  !value,
              )
            }
          >
            {collapsed
              ? "→"
              : "← Collapse"}
          </button>
        </div>
      </aside>

      <main className="nexus-workspace-main">
        <header className="nexus-workspace-header">
          <div>
            <span>
              WORKSPACE
            </span>

            <h1>
              {current.label}
            </h1>

            <p>
              {current.description}
            </p>
          </div>

          <div className="nexus-workspace-status">
            READ-ONLY ECU MODE
          </div>
        </header>

        <section className="nexus-workspace-content">
          {children}
        </section>
      </main>
    </div>
  );
}
