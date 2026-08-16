import type {
  DiagnosticEvent,
  DiagnosticHealthSummary,
  DiagnosticSeverity,
} from "./diagnosticEventTypes";

function severityRank(
  severity: DiagnosticSeverity,
): number {
  switch (severity) {
    case "critical":
      return 4;
    case "error":
      return 3;
    case "warning":
      return 2;
    default:
      return 1;
  }
}

export function buildDiagnosticHealthSummary(
  events: DiagnosticEvent[],
): DiagnosticHealthSummary {
  const highestSeverity =
    events.reduce<DiagnosticSeverity>(
      (
        highest,
        event,
      ) =>
        severityRank(
          event.severity,
        ) >
        severityRank(
          highest,
        )
          ? event.severity
          : highest,
      "info",
    );

  return {
    highestSeverity,
    infoCount:
      events.filter(
        event =>
          event.severity ===
          "info",
      ).length,
    warningCount:
      events.filter(
        event =>
          event.severity ===
          "warning",
      ).length,
    errorCount:
      events.filter(
        event =>
          event.severity ===
          "error",
      ).length,
    criticalCount:
      events.filter(
        event =>
          event.severity ===
          "critical",
      ).length,
    actionableCount:
      events.filter(
        event =>
          Boolean(
            event.recoveryAction,
          ),
      ).length,
  };
}

export function createDiagnosticEvent(
  severity: DiagnosticSeverity,
  category: DiagnosticEvent["category"],
  title: string,
  detail: string,
  recoveryAction: string | null = null,
): DiagnosticEvent {
  return {
    id:
      `diag-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,
    timestamp:
      new Date()
        .toISOString(),
    severity,
    category,
    title,
    detail,
    recoveryAction,
  };
}
