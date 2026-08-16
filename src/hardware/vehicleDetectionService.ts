import type {
  CanFrame,
} from "./canParser";

import type {
  VehicleDetectionSnapshot,
  DetectionField,
} from "./vehicleDetectionTypes";

function idHex(
  id: number,
): string {
  return `0x${id
    .toString(16)
    .toUpperCase()
    .padStart(
      id > 0x7ff
        ? 8
        : 3,
      "0",
    )}`;
}

function field(
  label: string,
  value: string,
  confidence:
    DetectionField["confidence"],
  evidence: string,
): DetectionField {
  return {
    label,
    value,
    confidence,
    evidence,
  };
}

export function buildVehicleDetectionSnapshot(
  frames: CanFrame[],
  vin: string | null,
  calibrationIds: string[],
  cvns: string[],
  ecuNames: string[],
  bitrateKbps: number | null,
): VehicleDetectionSnapshot {
  const ids =
    Array.from(
      new Set(
        frames.map(
          frame =>
            frame.id,
        ),
      ),
    ).sort(
      (
        a,
        b,
      ) =>
        a - b,
    );

  const diagResponders =
    ids.filter(
      id =>
        id >= 0x7e8 &&
        id <= 0x7ef,
    );

  const hasExtended =
    frames.some(
      frame =>
        frame.extended,
    );

  const hasStandard =
    frames.some(
      frame =>
        !frame.extended,
    );

  const vehicle:
    DetectionField[] = [
      field(
        "VIN",
        vin ??
          "UNKNOWN",
        vin
          ? "detected"
          : "unknown",
        vin
          ? "Decoded from vehicle-information response."
          : "No VIN response has been decoded.",
      ),
      field(
        "Vehicle Presence",
        frames.length
          ? "NETWORK ACTIVITY OBSERVED"
          : "UNKNOWN",
        frames.length
          ? "inferred"
          : "unknown",
        frames.length
          ? `${frames.length} CAN frame(s) observed on the selected interface.`
          : "No network traffic has been observed.",
      ),
    ];

  const network:
    DetectionField[] = [
      field(
        "CAN Bitrate",
        bitrateKbps
          ? `${bitrateKbps} KBIT/S`
          : "UNKNOWN",
        bitrateKbps
          ? "detected"
          : "unknown",
        bitrateKbps
          ? "Configured/observed by the active CAN monitor."
          : "No bitrate evidence is currently available.",
      ),
      field(
        "Identifier Format",
        hasStandard &&
        hasExtended
          ? "11-BIT + 29-BIT"
          : hasExtended
            ? "29-BIT"
            : hasStandard
              ? "11-BIT"
              : "UNKNOWN",
        frames.length
          ? "detected"
          : "unknown",
        frames.length
          ? "Derived directly from received CAN frames."
          : "No received frames.",
      ),
      field(
        "Unique CAN IDs",
        ids.length
          ? String(
              ids.length,
            )
          : "UNKNOWN",
        ids.length
          ? "detected"
          : "unknown",
        ids.length
          ? ids
              .slice(
                0,
                24,
              )
              .map(
                idHex,
              )
              .join(
                " · ",
              )
          : "No identifiers observed.",
      ),
    ];

  const ecu:
    DetectionField[] = [
      field(
        "Diagnostic Responders",
        diagResponders.length
          ? diagResponders
              .map(
                idHex,
              )
              .join(
                " · ",
              )
          : "UNKNOWN",
        diagResponders.length
          ? "detected"
          : "unknown",
        diagResponders.length
          ? "Standard 0x7E8–0x7EF diagnostic response IDs observed."
          : "No standard diagnostic response IDs observed.",
      ),
      field(
        "ECU Name",
        ecuNames.length
          ? ecuNames.join(
              " · ",
            )
          : "UNKNOWN",
        ecuNames.length
          ? "detected"
          : "unknown",
        ecuNames.length
          ? "Decoded from vehicle-information response."
          : "No ECU name response has been decoded.",
      ),
      field(
        "ECU Count",
        diagResponders.length
          ? String(
              diagResponders.length,
            )
          : ids.length
            ? "AT LEAST 1"
            : "UNKNOWN",
        diagResponders.length
          ? "detected"
          : ids.length
            ? "inferred"
            : "unknown",
        diagResponders.length
          ? "Count based on standard diagnostic response IDs."
          : ids.length
            ? "Vehicle-network activity implies at least one active controller."
            : "No ECU evidence observed.",
      ),
    ];

  const calibration:
    DetectionField[] = [
      field(
        "Calibration ID",
        calibrationIds.length
          ? calibrationIds.join(
              " · ",
            )
          : "UNKNOWN",
        calibrationIds.length
          ? "detected"
          : "unknown",
        calibrationIds.length
          ? "Decoded from vehicle-information response."
          : "No Calibration ID response decoded.",
      ),
      field(
        "CVN",
        cvns.length
          ? cvns.join(
              " · ",
            )
          : "UNKNOWN",
        cvns.length
          ? "detected"
          : "unknown",
        cvns.length
          ? "Decoded from Calibration Verification Number response."
          : "No CVN response decoded.",
      ),
    ];

  return {
    vehicle,
    network,
    ecu,
    calibration,
  };
}
