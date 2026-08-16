import type {
  NexusAccessMode,
} from "../desktop/accessModeSettings";

import type {
  AccessGateCheck,
  AccessGateSummary,
} from "./accessGateTypes";

export type AccessGateInput = {
  requestedMode:
    NexusAccessMode;

  adapterDetected:
    boolean;

  linkConnected:
    boolean;

  diagnosticResponderReady:
    boolean;

  identityReady:
    boolean;

  definitionMatched:
    boolean;

  calibrationBindingVerified:
    boolean;

  preflightReady:
    boolean;

  safetyPolicyAllows:
    boolean;

  backupAvailable:
    boolean;

  supplyVoltageSafe:
    boolean;

  programmingAcknowledged:
    boolean;
};

export function buildAccessGateSummary(
  input:
    AccessGateInput,
): AccessGateSummary {
  const checks:
    AccessGateCheck[] = [
      {
        id:
          "adapter",
        label:
          "Supported Adapter",
        passed:
          input.adapterDetected,
        requiredFor: [
          "advanced-diagnostic",
          "programming",
        ],
        detail:
          input.adapterDetected
            ? "A supported adapter is detected."
            : "No supported adapter is detected.",
      },
      {
        id:
          "link",
        label:
          "Transport Link",
        passed:
          input.linkConnected,
        requiredFor: [
          "advanced-diagnostic",
          "programming",
        ],
        detail:
          input.linkConnected
            ? "The transport link is connected."
            : "The transport link is disconnected.",
      },
      {
        id:
          "responder",
        label:
          "ECU Responder",
        passed:
          input.diagnosticResponderReady,
        requiredFor: [
          "advanced-diagnostic",
          "programming",
        ],
        detail:
          input.diagnosticResponderReady
            ? "A diagnostic ECU responder is confirmed."
            : "No diagnostic ECU responder is confirmed.",
      },
      {
        id:
          "identity",
        label:
          "ECU Identity",
        passed:
          input.identityReady,
        requiredFor: [
          "advanced-diagnostic",
          "programming",
        ],
        detail:
          input.identityReady
            ? "ECU identity evidence is available."
            : "ECU identity evidence is incomplete.",
      },
      {
        id:
          "definition",
        label:
          "Definition Match",
        passed:
          input.definitionMatched,
        requiredFor: [
          "programming",
        ],
        detail:
          input.definitionMatched
            ? "A verified ECU definition is matched."
            : "A verified ECU definition is required for programming mode.",
      },
      {
        id:
          "binding",
        label:
          "Calibration Binding",
        passed:
          input.calibrationBindingVerified,
        requiredFor: [
          "programming",
        ],
        detail:
          input.calibrationBindingVerified
            ? "ROM / definition / identity binding is verified."
            : "Calibration binding is not verified.",
      },
      {
        id:
          "preflight",
        label:
          "Session Preflight",
        passed:
          input.preflightReady,
        requiredFor: [
          "advanced-diagnostic",
          "programming",
        ],
        detail:
          input.preflightReady
            ? "Required preflight checks pass."
            : "Required preflight checks are blocked.",
      },
      {
        id:
          "safety",
        label:
          "Production Safety Policy",
        passed:
          input.safetyPolicyAllows,
        requiredFor: [
          "programming",
        ],
        detail:
          input.safetyPolicyAllows
            ? "Production safety policy permits the requested workflow."
            : "Production safety policy does not permit programming.",
      },
      {
        id:
          "backup",
        label:
          "Verified ROM Backup",
        passed:
          input.backupAvailable,
        requiredFor: [
          "programming",
        ],
        detail:
          input.backupAvailable
            ? "A verified ROM backup is available."
            : "Create and verify a ROM backup before programming.",
      },
      {
        id:
          "voltage",
        label:
          "Stable Supply Voltage",
        passed:
          input.supplyVoltageSafe,
        requiredFor: [
          "programming",
        ],
        detail:
          input.supplyVoltageSafe
            ? "Supply voltage is within the configured programming-safe range."
            : "Programming requires a stable, verified supply-voltage condition.",
      },
      {
        id:
          "acknowledgement",
        label:
          "Programming Acknowledgement",
        passed:
          input.programmingAcknowledged,
        requiredFor: [
          "programming",
        ],
        detail:
          input.programmingAcknowledged
            ? "Programming risk acknowledgement is recorded."
            : "Programming mode requires an explicit risk acknowledgement.",
      },
    ];

  const blockers =
    checks
      .filter(
        check =>
          check.requiredFor.includes(
            input.requestedMode,
          ) &&
          !check.passed,
      )
      .map(
        check =>
          `${check.label}: ${check.detail}`,
      );

  const allowed =
    input.requestedMode ===
      "read-only" ||
    blockers.length ===
      0;

  const effectiveMode:
    NexusAccessMode =
      allowed
        ? input.requestedMode
        : "read-only";

  return {
    requestedMode:
      input.requestedMode,

    effectiveMode,

    allowed,

    checks,

    blockers,

    summaryText:
      allowed
        ? input.requestedMode ===
          "read-only"
          ? "Read-only access is active."
          : input.requestedMode ===
            "advanced-diagnostic"
            ? "Advanced diagnostic access is permitted by the current gates."
            : "Programming mode is armed by policy, but no raw write/flash command is exposed by this release."
        : `${blockers.length} access requirement(s) are blocking ${input.requestedMode}. NEXUS remains in read-only mode.`,
  };
}
