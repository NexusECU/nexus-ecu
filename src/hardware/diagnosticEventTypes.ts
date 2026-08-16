export type DiagnosticSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type DiagnosticEventCategory =
  | "transport"
  | "network"
  | "ecu"
  | "identity"
  | "preflight"
  | "binding"
  | "storage"
  | "recovery";

export type DiagnosticEvent = {
  id: string;
  timestamp: string;
  severity: DiagnosticSeverity;
  category: DiagnosticEventCategory;
  title: string;
  detail: string;
  recoveryAction: string | null;
};

export type DiagnosticHealthSummary = {
  highestSeverity: DiagnosticSeverity;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  actionableCount: number;
};
