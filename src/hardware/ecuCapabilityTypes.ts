export type EcuCapabilityState =
  | "available"
  | "blocked"
  | "bridge-required"
  | "not-implemented"
  | "unsupported";

export type EcuCapabilityKey =
  | "identify"
  | "live-data"
  | "dtc-read"
  | "dtc-clear"
  | "rom-read"
  | "rom-backup"
  | "calibration-edit"
  | "rom-write"
  | "recovery";

export type EcuCapabilityEntry = {
  key: EcuCapabilityKey;
  label: string;
  state: EcuCapabilityState;
  reason: string;
};

export type EcuCapabilityMatrix = {
  entries: EcuCapabilityEntry[];
  availableCount: number;
  blockedCount: number;
  bridgeRequiredCount: number;
  notImplementedCount: number;
  unsupportedCount: number;
};
