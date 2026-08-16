import type {
  EcuPreflightCheck,
  EcuPreflightSummary,
} from "./ecuPreflightTypes";

export type EcuPreflightInput = {
  adapterDetected: boolean;
  linkConnected: boolean;
  canMonitorActive: boolean;
  framesObserved: number;
  diagnosticResponderReady: boolean;
  identityReady: boolean;
  definitionMatched: boolean;
  availableCapabilities: number;
  romLoaded: boolean;
};

export function buildEcuPreflightSummary(
  input: EcuPreflightInput,
): EcuPreflightSummary {
  const checks: EcuPreflightCheck[] = [
    {
      id: "adapter",
      label: "Supported Adapter",
      required: true,
      passed: input.adapterDetected,
      detail: input.adapterDetected
        ? "A supported hardware adapter is detected."
        : "Detect and select a supported adapter.",
    },
    {
      id: "link",
      label: "Transport Link",
      required: true,
      passed: input.linkConnected,
      detail: input.linkConnected
        ? "The read-only hardware transport is connected."
        : "Connect the selected provider before starting an ECU session.",
    },
    {
      id: "network",
      label: "Vehicle Network Evidence",
      required: true,
      passed:
        input.canMonitorActive &&
        input.framesObserved > 0,
      detail:
        input.canMonitorActive &&
        input.framesObserved > 0
          ? `${input.framesObserved} captured frame(s) provide live network evidence.`
          : "Open the CAN monitor and confirm real vehicle-network traffic.",
    },
    {
      id: "responder",
      label: "ECU Responder",
      required: true,
      passed: input.diagnosticResponderReady,
      detail: input.diagnosticResponderReady
        ? "A diagnostic ECU responder has been observed."
        : "No diagnostic ECU responder has been confirmed.",
    },
    {
      id: "identity",
      label: "ECU Identity",
      required: true,
      passed: input.identityReady,
      detail: input.identityReady
        ? "ECU identity evidence is available."
        : "Acquire VIN, Calibration ID, ECU name, or equivalent identity evidence.",
    },
    {
      id: "definition",
      label: "Definition Match",
      required: false,
      passed: input.definitionMatched,
      detail: input.definitionMatched
        ? "A compatible calibration definition is matched."
        : "No verified calibration definition is matched yet.",
    },
    {
      id: "capabilities",
      label: "Usable Capability",
      required: true,
      passed: input.availableCapabilities > 0,
      detail:
        input.availableCapabilities > 0
          ? `${input.availableCapabilities} ECU operation(s) are currently available.`
          : "No ECU operations currently pass the capability gates.",
    },
    {
      id: "rom",
      label: "Reference ROM",
      required: false,
      passed: input.romLoaded,
      detail: input.romLoaded
        ? "A ROM image is loaded for reference and backup context."
        : "No reference ROM is loaded. This is advisory for read-only identification.",
    },
  ];

  const requiredBlockedCount =
    checks.filter(
      check =>
        check.required &&
        !check.passed,
    ).length;

  const advisoryBlockedCount =
    checks.filter(
      check =>
        !check.required &&
        !check.passed,
    ).length;

  const verdict =
    requiredBlockedCount > 0
      ? "blocked"
      : advisoryBlockedCount > 0
        ? "caution"
        : "ready";

  return {
    verdict,
    passedCount:
      checks.filter(
        check => check.passed,
      ).length,
    totalCount: checks.length,
    requiredBlockedCount,
    checks,
    summaryText:
      verdict === "ready"
        ? "All required preflight gates pass. The read-only ECU session is ready to proceed."
        : verdict === "caution"
          ? "Required preflight gates pass, but advisory verification remains."
          : `${requiredBlockedCount} required preflight gate(s) are blocking session readiness.`,
  };
}
