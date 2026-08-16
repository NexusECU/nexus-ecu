import type {
  CanFrame,
} from "./canParser";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import type {
  HardwareDiagnosticCheck,
  HardwareReadinessReport,
} from "./hardwareDiagnosticsTypes";

function hasDiagnosticResponses(
  frames: CanFrame[],
): boolean {
  return frames.some(
    frame =>
      frame.id >= 0x7e8 &&
      frame.id <= 0x7ef,
  );
}

function recentFrameRate(
  frames: CanFrame[],
): number {
  const now =
    Date.now();

  return frames.filter(
    frame =>
      now -
      frame.timestampMs <=
      1000,
  ).length;
}

export function buildHardwareReadinessReport(
  connection: HardwareConnectionInfo,
  frames: CanFrame[],
  adapterDetected: boolean,
  canMonitorActive: boolean,
  bitrateKbps: number | null,
  vin: string | null,
  calibrationIds: string[],
  lastError: string | null,
): HardwareReadinessReport {
  const checks:
    HardwareDiagnosticCheck[] = [];

  checks.push({
    id: "adapter",
    label: "Adapter Detection",
    status:
      adapterDetected
        ? "pass"
        : "fail",
    detail:
      adapterDetected
        ? "A supported adapter is detected."
        : "No supported adapter is detected.",
  });

  checks.push({
    id: "link",
    label: "Hardware Link",
    status:
      connection.connected
        ? "pass"
        : "fail",
    detail:
      connection.connected
        ? "Hardware connection is open."
        : "Hardware connection is not open.",
  });

  checks.push({
    id: "can-monitor",
    label: "CAN Receive Monitor",
    status:
      !adapterDetected
        ? "unknown"
        : canMonitorActive
          ? "pass"
          : "warning",
    detail:
      !adapterDetected
        ? "Cannot test CAN receive without an adapter."
        : canMonitorActive
          ? "CAN receive monitor is active."
          : "Adapter is present but CAN receive monitor is inactive.",
  });

  checks.push({
    id: "traffic",
    label: "Vehicle Network Traffic",
    status:
      frames.length > 0
        ? "pass"
        : adapterDetected
          ? "warning"
          : "unknown",
    detail:
      frames.length > 0
        ? `${frames.length} frame(s) observed; ${recentFrameRate(frames)} frame(s)/s recently.`
        : adapterDetected
          ? "No CAN frames have been observed yet."
          : "Traffic test is unavailable until an adapter is connected.",
  });

  checks.push({
    id: "bitrate",
    label: "CAN Bitrate",
    status:
      bitrateKbps
        ? "pass"
        : adapterDetected
          ? "warning"
          : "unknown",
    detail:
      bitrateKbps
        ? `Configured/observed bitrate: ${bitrateKbps} kbit/s.`
        : "CAN bitrate is currently unknown.",
  });

  checks.push({
    id: "mode09",
    label: "Mode 09 Diagnostic Evidence",
    status:
      hasDiagnosticResponses(frames)
        ? "pass"
        : frames.length > 0
          ? "warning"
          : "unknown",
    detail:
      hasDiagnosticResponses(frames)
        ? "Diagnostic response IDs 0x7E8–0x7EF were observed."
        : frames.length > 0
          ? "Traffic is present, but no standard diagnostic response IDs were observed."
          : "No traffic available to validate Mode 09 response evidence.",
  });

  checks.push({
    id: "vin",
    label: "VIN Validation",
    status:
      vin
        ? vin.length === 17
          ? "pass"
          : "warning"
        : "unknown",
    detail:
      vin
        ? vin.length === 17
          ? `VIN decoded: ${vin}`
          : `VIN-like value decoded but length is ${vin.length}, expected 17.`
        : "VIN has not been decoded yet.",
  });

  checks.push({
    id: "calibration-id",
    label: "Calibration ID",
    status:
      calibrationIds.length > 0
        ? "pass"
        : "unknown",
    detail:
      calibrationIds.length > 0
        ? `Calibration ID(s): ${calibrationIds.join(" · ")}`
        : "No calibration ID has been decoded yet.",
  });

  checks.push({
    id: "errors",
    label: "Transport Errors",
    status:
      lastError
        ? "fail"
        : "pass",
    detail:
      lastError
        ? lastError
        : "No active transport error is reported.",
  });

  const passed =
    checks.filter(
      check =>
        check.status === "pass",
    ).length;

  const failed =
    checks.filter(
      check =>
        check.status === "fail",
    ).length;

  const warnings =
    checks.filter(
      check =>
        check.status === "warning",
    ).length;

  const unknown =
    checks.filter(
      check =>
        check.status === "unknown",
    ).length;

  return {
    generatedAt:
      new Date().toISOString(),
    ready:
      failed === 0 &&
      adapterDetected &&
      connection.connected,
    passed,
    failed,
    warnings,
    unknown,
    checks,
  };
}
