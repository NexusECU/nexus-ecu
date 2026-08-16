export type ProjectDashboardMetric = {
  label:
    string;

  value:
    string;

  detail:
    string;
};

export type ProjectDashboardQuickAction =
  | "open-session"
  | "open-backups"
  | "open-browser"
  | "save-project"
  | "restore-session";
