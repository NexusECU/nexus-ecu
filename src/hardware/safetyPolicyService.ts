import type {
  SafetyGate,
  SafetyPolicySummary,
} from "./safetyPolicyTypes";

export type SafetyPolicyInput = {
  adapterDetected: boolean;
  linkConnected: boolean;
  networkEvidence: boolean;
  diagnosticResponderReady: boolean;
  identityReady: boolean;
  definitionMatched: boolean;
  bindingVerified: boolean;
  preflightReady: boolean;
  activeSession: boolean;
  diagnosticCriticalCount: number;
  diagnosticErrorCount: number;
};

export function buildSafetyPolicySummary(
  input: SafetyPolicyInput,
): SafetyPolicySummary {
  const gates: SafetyGate[] = [
    {
      id: "adapter",
      label: "Supported Adapter",
      required: true,
      passed: input.adapterDetected,
      detail: input.adapterDetected
        ? "A supported adapter is detected."
        : "No supported adapter is detected.",
    },
    {
      id: "link",
      label: "Transport Link",
      required: true,
      passed: input.linkConnected,
      detail: input.linkConnected
        ? "The selected transport is connected."
        : "The selected transport is disconnected.",
    },
    {
      id: "network",
      label: "Vehicle Network Evidence",
      required: true,
      passed: input.networkEvidence,
      detail: input.networkEvidence
        ? "Vehicle-network traffic has been observed."
        : "No vehicle-network traffic has been confirmed.",
    },
    {
      id: "responder",
      label: "ECU Responder",
      required: true,
      passed: input.diagnosticResponderReady,
      detail: input.diagnosticResponderReady
        ? "A diagnostic ECU responder is confirmed."
        : "No diagnostic ECU responder is confirmed.",
    },
    {
      id: "identity",
      label: "ECU Identity",
      required: true,
      passed: input.identityReady,
      detail: input.identityReady
        ? "ECU identity evidence is available."
        : "ECU identity evidence is incomplete.",
    },
    {
      id: "definition",
      label: "Definition Match",
      required: false,
      passed: input.definitionMatched,
      detail: input.definitionMatched
        ? "A compatible definition is matched."
        : "No verified definition match is available.",
    },
    {
      id: "binding",
      label: "Calibration Binding",
      required: false,
      passed: input.bindingVerified,
      detail: input.bindingVerified
        ? "ROM / Calibration ID / definition binding is verified."
        : "Calibration binding is not verified.",
    },
    {
      id: "preflight",
      label: "Readiness Preflight",
      required: true,
      passed: input.preflightReady,
      detail: input.preflightReady
        ? "Required preflight checks pass."
        : "Required preflight checks are not ready.",
    },
    {
      id: "session",
      label: "Read-Only Session",
      required: false,
      passed: input.activeSession,
      detail: input.activeSession
        ? "A read-only session is active."
        : "No active read-only ECU session exists.",
    },
    {
      id: "diagnostics",
      label: "Diagnostic Health",
      required: true,
      passed:
        input.diagnosticCriticalCount === 0 &&
        input.diagnosticErrorCount === 0,
      detail:
        input.diagnosticCriticalCount > 0
          ? `${input.diagnosticCriticalCount} critical diagnostic event(s) are active.`
          : input.diagnosticErrorCount > 0
            ? `${input.diagnosticErrorCount} error diagnostic event(s) are active.`
            : "No active diagnostic errors or critical events.",
    },
  ];

  const required =
    gates.filter(
      gate => gate.required,
    );

  const requiredPassed =
    required.filter(
      gate => gate.passed,
    ).length;

  const optionalFailures =
    gates.filter(
      gate =>
        !gate.required &&
        !gate.passed,
    );

  const blockedReasons =
    required
      .filter(
        gate => !gate.passed,
      )
      .map(
        gate =>
          `${gate.label}: ${gate.detail}`,
      );

  const cautionReasons =
    optionalFailures.map(
      gate =>
        `${gate.label}: ${gate.detail}`,
    );

  const decision =
    blockedReasons.length > 0
      ? "block"
      : cautionReasons.length > 0
        ? "caution"
        : "allow";

  const score =
    Math.round(
      gates.filter(
        gate => gate.passed,
      ).length /
      gates.length *
      100,
    );

  return {
    decision,
    score,
    requiredPassed,
    requiredTotal:
      required.length,
    gates,
    blockedReasons,
    cautionReasons,
    summaryText:
      decision === "allow"
        ? "All required production safety gates pass."
        : decision === "caution"
          ? "Required safety gates pass, but advisory verification remains."
          : `${blockedReasons.length} required production safety gate(s) are blocking the workflow.`,
  };
}
