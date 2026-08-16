import type {
  TransportProviderId,
} from "./transportTypes";

export type EcuReadStage =
  | "idle"
  | "checking-provider"
  | "checking-link"
  | "identifying"
  | "reading"
  | "verifying"
  | "complete"
  | "failed";

export type EcuReadLogEntry = {
  id: string;
  timestamp: string;
  level:
    "info" |
    "success" |
    "warning" |
    "error";
  message: string;
};

export type EcuBackupRecord = {
  id: string;
  createdAt: string;
  providerId: TransportProviderId;
  source:
    "simulated-read" |
    "offline-image";
  fileName: string;
  sizeBytes: number;
  sha256: string;
  verified: boolean;
  ecuIdentity: string;
  protocol: string;
  bytes: Uint8Array;
};
