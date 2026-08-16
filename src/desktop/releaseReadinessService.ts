import type {
  ReleaseReadinessCheck,
  ReleaseReadinessSummary,
} from "./releaseReadinessTypes";

export type ReleaseReadinessInput = {
  tauriDesktop: boolean;
  storageRootReady: boolean;
  projectPersistenceReady: boolean;
  safetyPolicyPresent: boolean;
  diagnosticsPresent: boolean;
  versionIsTen: boolean;
};

export function buildReleaseReadinessSummary(
  input: ReleaseReadinessInput,
): ReleaseReadinessSummary {
  const checks: ReleaseReadinessCheck[] = [
    {
      id: "desktop",
      label: " Runtime",
      required: true,
      passed: input.tauriDesktop,
      detail: input.tauriDesktop
        ? " runtime is active."
        : "NEXUS is not running in the  runtime.",
    },
    {
      id: "storage",
      label: "Project Storage Root",
      required: true,
      passed: input.storageRootReady,
      detail: input.storageRootReady
        ? "The persistent project storage root is available."
        : "Persistent project storage is not available.",
    },
    {
      id: "persistence",
      label: "Project Persistence",
      required: true,
      passed: input.projectPersistenceReady,
      detail: input.projectPersistenceReady
        ? "Project/session persistence is available."
        : "Project/session persistence is not ready.",
    },
    {
      id: "safety",
      label: "Unified Safety Policy",
      required: true,
      passed: input.safetyPolicyPresent,
      detail: input.safetyPolicyPresent
        ? "Production safety policy is present."
        : "Production safety policy is missing.",
    },
    {
      id: "diagnostics",
      label: "Diagnostic Recovery Center",
      required: true,
      passed: input.diagnosticsPresent,
      detail: input.diagnosticsPresent
        ? "Unified diagnostics and recovery are available."
        : "Diagnostic recovery integration is missing.",
    },
    {
      id: "version",
      label: "Production Version",
      required: false,
      passed: input.versionIsTen,
      detail: input.versionIsTen
        ? "Application version is on the v10 production line."
        : "Application version is not yet on the v10 production line.",
    },
  ];

  const requiredBlocked =
    checks.filter(
      check =>
        check.required &&
        !check.passed,
    ).length;

  const advisoryBlocked =
    checks.filter(
      check =>
        !check.required &&
        !check.passed,
    ).length;

  const status =
    requiredBlocked > 0
      ? "blocked"
      : advisoryBlocked > 0
        ? "attention"
        : "ready";

  return {
    status,
    score:
      Math.round(
        checks.filter(
          check => check.passed,
        ).length /
        checks.length *
        100,
      ),
    checks,
    requiredBlocked,
    summaryText:
      status === "ready"
        ? "NEXUS ECU meets the production baseline checks."
        : status === "attention"
          ? "Required production checks pass, but advisory release items remain."
          : `${requiredBlocked} required production release check(s) are blocking readiness.`,
  };
}
