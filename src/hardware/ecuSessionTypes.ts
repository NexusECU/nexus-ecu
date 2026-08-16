export type EcuSessionReadiness =
  | "blocked"
  | "partial"
  | "ready";

export type EcuSessionTimelineEntry = {
  id: string;
  timestamp: string;
  label: string;
  detail: string;
};

export type EcuSessionSnapshot = {
  readiness: EcuSessionReadiness;
  selectedEcuAddress: string;
  protocol: string;
  vin: string;
  calibrationId: string;
  adapterReady: boolean;
  linkReady: boolean;
  diagnosticsReady: boolean;
  identityReady: boolean;
  operationLockReason: string;
};
