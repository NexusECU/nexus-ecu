import type {
  NexusWorkspaceKey,
} from "./NexusWorkspaceShell";

type Props = {
  workspace:
    NexusWorkspaceKey;

  home:
    React.ReactNode;

  project:
    React.ReactNode;

  hardware:
    React.ReactNode;

  ecu:
    React.ReactNode;

  diagnostics:
    React.ReactNode;

  tuning:
    React.ReactNode;

  logging:
    React.ReactNode;

  safety:
    React.ReactNode;

  settings:
    React.ReactNode;
};

export function NexusWorkspaceRouter({
  workspace,
  home,
  project,
  hardware,
  ecu,
  diagnostics,
  tuning,
  logging,
  safety,
  settings,
}: Props) {
  switch (
    workspace
  ) {
    case "project":
      return <>{project}</>;

    case "hardware":
      return <>{hardware}</>;

    case "ecu":
      return <>{ecu}</>;

    case "diagnostics":
      return <>{diagnostics}</>;

    case "tuning":
      return <>{tuning}</>;

    case "logging":
      return <>{logging}</>;

    case "safety":
      return <>{safety}</>;

    case "settings":
      return <>{settings}</>;

    default:
      return <>{home}</>;
  }
}
