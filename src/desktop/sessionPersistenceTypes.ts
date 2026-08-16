import type {
  TransportProviderId,
} from "../hardware/transportTypes";

export type PersistedWorkspaceTab =
  | "overview"
  | "identification"
  | "live"
  | "diagnostics"
  | "read-backup"
  | "capabilities"
  | "session";

export type PersistedEcuIdentity = {
  vin: string | null;

  calibrationIds: string[];

  cvns: string[];

  ecuNames: string[];
};

export type PersistedHardwareSession = {
  providerId:
    TransportProviderId;

  selectedPort:
    string;

  serialBaud:
    number;

  canBitrateKbps:
    number;

  workspaceTab:
    PersistedWorkspaceTab;

  selectedEcuAddress:
    string;

  identity:
    PersistedEcuIdentity;
};

export type PersistedRomBinding = {
  fileName:
    string;

  sizeBytes:
    number;

  sha256:
    string;
};

export type PersistedDefinitionBinding = {
  id:
    string;

  name:
    string;

  romId:
    string;
};

export type NexusProjectSessionState = {
  schemaVersion:
    1;

  updatedAt:
    string;

  hardware:
    PersistedHardwareSession;

  rom:
    PersistedRomBinding | null;

  definition:
    PersistedDefinitionBinding | null;
};
