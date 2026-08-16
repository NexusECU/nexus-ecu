import {
  BookOpen,
  CarFront,
  Cpu,
  HardDrive,
  Home,
  Settings,
  Wrench,
} from "lucide-react";

import "./nexus-primary-navigation.css";

export type NexusPrimaryWorkspace =
  | "home"
  | "project"
  | "hardware"
  | "ecu"
  | "settings";

type Props = {
  active:
    NexusPrimaryWorkspace;

  onChange: (
    workspace:
      NexusPrimaryWorkspace,
  ) => void;

  version:
    string;
};

const items:
  Array<{
    key:
      NexusPrimaryWorkspace;
    label:
      string;
    detail:
      string;
    icon:
      React.ReactNode;
  }> = [
    {
      key: "home",
      label: "Home",
      detail: "Overview",
      icon: <Home size={15} />,
    },
    {
      key: "project",
      label: "Project",
      detail: "Vehicle & files",
      icon: <CarFront size={15} />,
    },
    {
      key: "hardware",
      label: "Hardware",
      detail: "Adapters & CAN",
      icon: <Wrench size={15} />,
    },
    {
      key: "ecu",
      label: "ECU",
      detail: "Identity & ROM",
      icon: <Cpu size={15} />,
    },
    {
      key: "settings",
      label: "Settings",
      detail: "Preferences",
      icon: <Settings size={15} />,
    },
  ];

export function NexusPrimaryNavigation({
  active,
  onChange,
  version,
}: Props) {
  return (
    <aside className="nexus-primary-nav">
      <div className="nexus-primary-brand">
        <HardDrive size={17} />

        <div>
          <strong>NEXUS ECU</strong>
          <span>v{version}</span>
        </div>
      </div>

      <nav>
        {items.map(item => (
          <button
            type="button"
            key={item.key}
            className={
              active === item.key
                ? "active"
                : ""
            }
            onClick={() =>
              onChange(item.key)
            }
          >
            <span className="icon">
              {item.icon}
            </span>

            <span className="copy">
              <strong>{item.label}</strong>
              <em>{item.detail}</em>
            </span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="nexus-primary-tutorial"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent(
              "nexus:start-tutorial",
            ),
          )
        }
      >
        <BookOpen size={14} />
        Tutorial
      </button>
    </aside>
  );
}
