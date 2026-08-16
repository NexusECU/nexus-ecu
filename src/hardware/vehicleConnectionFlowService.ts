import type {
  VehicleConnectionFlow,
  VehicleConnectionStage,
} from "./vehicleConnectionFlowTypes";

export function buildVehicleConnectionFlow(
  adapterDetected: boolean,
  linkConnected: boolean,
  canMonitorActive: boolean,
  framesObserved: number,
  diagnosticResponderReady: boolean,
  identityReady: boolean,
  sessionStarted: boolean,
): VehicleConnectionFlow {
  const stages: VehicleConnectionStage[] = [];

  const adapterComplete =
    adapterDetected;

  const interfaceComplete =
    adapterComplete &&
    linkConnected;

  const networkComplete =
    interfaceComplete &&
    canMonitorActive &&
    framesObserved > 0;

  const ecuComplete =
    networkComplete &&
    diagnosticResponderReady;

  const sessionComplete =
    ecuComplete &&
    sessionStarted;

  const ready =
    sessionComplete;

  const push = (
    id: VehicleConnectionStage["id"],
    label: string,
    complete: boolean,
    prerequisiteComplete: boolean,
    detail: string,
  ) => {
    let state:
      VehicleConnectionStage["state"] =
        "pending";

    if (complete) {
      state =
        "complete";
    } else if (prerequisiteComplete) {
      state =
        "active";
    } else {
      state =
        "blocked";
    }

    stages.push({
      id,
      label,
      state,
      detail,
    });
  };

  push(
    "adapter",
    "Connect Adapter",
    adapterComplete,
    true,
    adapterComplete
      ? "Supported adapter detected."
      : "Connect and select a supported adapter.",
  );

  push(
    "interface",
    "Verify Interface",
    interfaceComplete,
    adapterComplete,
    interfaceComplete
      ? "Hardware link is open."
      : adapterComplete
        ? "Adapter is detected but the hardware link is not open."
        : "Waiting for adapter detection.",
  );

  push(
    "network",
    "Detect Network",
    networkComplete,
    interfaceComplete,
    networkComplete
      ? `${framesObserved} CAN frame(s) observed.`
      : interfaceComplete
        ? canMonitorActive
          ? "CAN monitor is active but no network traffic has been observed yet."
          : "Start the CAN receive monitor."
        : "Waiting for a verified interface.",
  );

  push(
    "ecu",
    "Identify ECU",
    ecuComplete,
    networkComplete,
    ecuComplete
      ? identityReady
        ? "Diagnostic responder and identity evidence detected."
        : "Diagnostic responder detected; identity data is still incomplete."
      : networkComplete
        ? "Vehicle traffic is present, but no standard diagnostic ECU responder has been confirmed."
        : "Waiting for vehicle-network detection.",
  );

  push(
    "session",
    "Start Session",
    sessionComplete,
    ecuComplete,
    sessionComplete
      ? "Read-only ECU session is active."
      : ecuComplete
        ? "ECU is detected and ready for a read-only session."
        : "Waiting for ECU detection.",
  );

  stages.push({
    id:
      "ready",
    label:
      "Ready",
    state:
      ready
        ? "complete"
        : "blocked",
    detail:
      ready
        ? "Guided connection flow is complete."
        : "Complete the earlier stages first.",
  });

  const current =
    stages.find(
      stage =>
        stage.state ===
        "active",
    ) ??
    stages.find(
      stage =>
        stage.state !==
        "complete",
    ) ??
    stages[
      stages.length -
      1
    ];

  let blockedReason:
    string | null =
      null;

  if (!adapterDetected) {
    blockedReason =
      "No supported adapter is detected.";
  } else if (!linkConnected) {
    blockedReason =
      "The selected adapter is not connected.";
  } else if (!canMonitorActive) {
    blockedReason =
      "The CAN receive monitor is not active.";
  } else if (framesObserved <= 0) {
    blockedReason =
      "No vehicle-network traffic has been observed.";
  } else if (!diagnosticResponderReady) {
    blockedReason =
      "No standard diagnostic ECU responder has been confirmed.";
  } else if (!sessionStarted) {
    blockedReason =
      "Start the read-only ECU session to complete the flow.";
  }

  const completeCount =
    stages.filter(
      stage =>
        stage.state ===
        "complete",
    ).length;

  return {
    stages,
    currentStage:
      current.id,
    ready,
    blockedReason,
    progress:
      Math.round(
        (
          completeCount /
          stages.length
        ) *
          100,
      ),
  };
}
