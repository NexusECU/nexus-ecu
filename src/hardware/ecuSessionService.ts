import type {
  EcuSessionSnapshot,
} from "./ecuSessionTypes";

export function buildEcuSessionSnapshot(
  selectedEcuAddress: string,
  protocol: string,
  vin: string | null,
  calibrationIds: string[],
  adapterReady: boolean,
  linkReady: boolean,
  diagnosticResponders: string[],
): EcuSessionSnapshot {
  const diagnosticsReady =
    diagnosticResponders.length > 0;

  const identityReady =
    Boolean(
      vin ||
      calibrationIds.length > 0,
    );

  let readiness:
    EcuSessionSnapshot[
      "readiness"
    ] =
      "blocked";

  let operationLockReason =
    "Hardware adapter is not ready.";

  if (
    adapterReady &&
    linkReady
  ) {
    readiness =
      diagnosticsReady
        ? identityReady
          ? "ready"
          : "partial"
        : "partial";

    operationLockReason =
      readiness === "ready"
        ? "READ-ONLY SESSION READY"
        : diagnosticsReady
          ? "ECU responder detected, but identity is incomplete."
          : "Hardware is connected, but no diagnostic ECU responder has been confirmed.";
  }

  return {
    readiness,
    selectedEcuAddress,
    protocol,
    vin:
      vin ??
      "UNKNOWN",
    calibrationId:
      calibrationIds.length
        ? calibrationIds.join(
            " · ",
          )
        : "UNKNOWN",
    adapterReady,
    linkReady,
    diagnosticsReady,
    identityReady,
    operationLockReason,
  };
}
