import {
  Activity,
  BookOpen,
  CarFront,
  Cpu,
  Gauge,
  Home,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

import "./nexus-top-navigation.css";

export type NexusTopWorkspace =
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
    NexusTopWorkspace;

  onChange: (
    workspace:
      NexusTopWorkspace,
  ) => void;
};

const tabs:
  Array<{
    key:
      NexusTopWorkspace;
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
        <Settings size={12} />,
    },
  ];

export function NexusTopNavigation({
  active,
  onChange,
}: Props) {
  return (
    <div className="nexus-top-navigation">
      <div className="nexus-top-tabs">
        {tabs.map(
          tab => (
            <button
              type="button"
              key={
                tab.key
              }
              className={
                active ===
                tab.key
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChange(
                  tab.key,
                )
              }
            >
              {tab.icon}
              <span>
                {tab.label}
              </span>
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="nexus-top-tutorial"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent(
              "nexus:start-tutorial",
            ),
          )
        }
      >
        <BookOpen size={12} />
        Tutorial
      </button>
    </div>
  );
}
