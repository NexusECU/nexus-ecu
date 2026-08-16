import type {
  CanFrame,
} from "./canParser";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import type {
  ReadOnlyHardwareSnapshot,
} from "./readOnlySessionTypes";

function uniqueIds(
  frames:
    CanFrame[],
): number[] {
  return Array.from(
    new Set(
      frames.map(
        (frame) =>
          frame.id,
      ),
    ),
  ).sort(
    (
      a,
      b,
    ) =>
      a -
      b,
  );
}

function idHex(
  id: number,
): string {
  return `0x${id
    .toString(
      16,
    )
    .toUpperCase()
    .padStart(
      id >
      0x7ff
        ? 8
        : 3,
      "0",
    )}`;
}

function inRange(
  id: number,
  minimum: number,
  maximum: number,
): boolean {
  return (
    id >=
      minimum &&
    id <=
      maximum
  );
}

export function analyseReadOnlyHardwareSession(
  providerId:
    TransportProviderId,
  connection:
    HardwareConnectionInfo,
  frames:
    CanFrame[],
  canMonitorActive:
    boolean,
  bitrateKbps:
    number | null,
  lastActivityMs:
    number | null,
): ReadOnlyHardwareSnapshot {
  const ids =
    uniqueIds(
      frames,
    );

  const diagnosticResponseIds =
    ids
      .filter(
        (id) =>
          inRange(
            id,
            0x7e8,
            0x7ef,
          ),
      )
      .map(
        idHex,
      );

  const diagnosticRequestIds =
    ids
      .filter(
        (id) =>
          id ===
            0x7df ||
          inRange(
            id,
            0x7e0,
            0x7e7,
          ),
      )
      .map(
        idHex,
      );

  const standardFrames =
    frames.filter(
      (frame) =>
        !frame.extended,
    ).length;

  const extendedFrames =
    frames.filter(
      (frame) =>
        frame.extended,
    ).length;

  const remoteFrames =
    frames.filter(
      (frame) =>
        frame.remote,
    ).length;

  const recent =
    frames.filter(
      (frame) =>
        Date.now() -
          frame.timestampMs <=
        1000,
    );

  const protocolEvidence:
    string[] = [];

  if (
    standardFrames >
    0
  ) {
    protocolEvidence.push(
      "11-bit CAN traffic observed",
    );
  }

  if (
    extendedFrames >
    0
  ) {
    protocolEvidence.push(
      "29-bit CAN traffic observed",
    );
  }

  if (
    diagnosticResponseIds.length >
    0
  ) {
    protocolEvidence.push(
      "OBD/UDS-style diagnostic response IDs observed",
    );
  }

  if (
    diagnosticRequestIds.length >
    0
  ) {
    protocolEvidence.push(
      "Diagnostic request IDs observed",
    );
  }

  if (
    remoteFrames >
    0
  ) {
    protocolEvidence.push(
      "CAN remote frames observed",
    );
  }

  let identityConfidence:
    ReadOnlyHardwareSnapshot[
      "identityConfidence"
    ] =
      "none";

  let identitySummary =
    "No ECU-identifying evidence observed yet.";

  if (
    diagnosticResponseIds.length >
    0
  ) {
    identityConfidence =
      "observed";

    identitySummary =
      `Diagnostic ECU response traffic observed on ${diagnosticResponseIds.join(", ")}. VIN / calibration identity has not been actively requested.`;
  } else if (
    ids.length >
    0
  ) {
    identityConfidence =
      "partial";

    identitySummary =
      `${ids.length} unique CAN identifier(s) observed. This confirms vehicle-network activity but does not uniquely identify an ECU.`;
  }

  return {
    providerId,

    connected:
      connection.connected,

    canMonitorActive,

    bitrateKbps,

    frameCount:
      frames.length,

    uniqueCanIds:
      ids.length,

    standardFrames,

    extendedFrames,

    remoteFrames,

    diagnosticResponseIds,

    diagnosticRequestIds,

    framesPerSecond:
      recent.length,

    bytesReceived:
      connection.bytesReceived,

    lastActivityMs,

    identityConfidence,

    identitySummary,

    protocolEvidence,
  };
}
