import type {
  AdapterConnectionSettings,
  AdapterConnectionTestReport,
} from "./adapterConnectionWizardTypes";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

export function explainConnectionFailure(
  error:
    string | null,
): string[] {
  if (!error) {
    return [];
  }

  const text =
    error.toLowerCase();

  const recommendations:
    string[] = [];

  if (
    text.includes(
      "semaphore timeout",
    )
  ) {
    recommendations.push(
      "Windows timed out while opening or communicating with the serial device.",
    );

    recommendations.push(
      "Confirm the selected COM port belongs to the ECU adapter and is not a stale or unrelated serial port.",
    );

    recommendations.push(
      "Close other software that may already have the COM port open.",
    );

    recommendations.push(
      "Check the adapter driver and try a baud rate recommended by its adapter profile.",
    );
  }

  if (
    text.includes(
      "access is denied",
    )
  ) {
    recommendations.push(
      "Another application may already have this adapter/COM port open.",
    );
  }

  if (
    text.includes(
      "not found",
    ) ||
    text.includes(
      "cannot find",
    )
  ) {
    recommendations.push(
      "The adapter or driver is not currently available to Windows.",
    );
  }

  if (
    recommendations.length ===
    0
  ) {
    recommendations.push(
      "Check the adapter driver, connection, selected provider and interface settings.",
    );
  }

  return recommendations;
}

export function buildConnectionTestReport(
  settings:
    AdapterConnectionSettings,
  connection:
    HardwareConnectionInfo,
  error:
    string | null,
  framesObserved:
    number,
): AdapterConnectionTestReport {
  if (error) {
    return {
      result:
        "failed",
      title:
        "Connection test failed",
      detail:
        error,
      recommendations:
        explainConnectionFailure(
          error,
        ),
    };
  }

  if (
    !connection.connected
  ) {
    return {
      result:
        "partial",
      title:
        "Adapter not connected yet",
      detail:
        "The selected configuration is ready to test, but no active hardware link is open.",
      recommendations: [
        "Connect the adapter and run the connection test.",
      ],
    };
  }

  if (
    framesObserved >
    0
  ) {
    return {
      result:
        "connected",
      title:
        "Connection verified",
      detail:
        `${framesObserved} CAN frame(s) have been observed through the selected provider.`,
      recommendations: [],
    };
  }

  return {
    result:
      "partial",
    title:
      "Adapter connected / no vehicle traffic yet",
    detail:
      `The ${settings.providerId} hardware link is open, but NEXUS has not observed CAN traffic yet.`,
    recommendations: [
      "Confirm the adapter is connected to the vehicle.",
      "Confirm ignition state where appropriate.",
      "Check CAN bitrate / adapter configuration.",
    ],
  };
}
