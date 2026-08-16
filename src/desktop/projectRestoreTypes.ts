import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

export type RestoreCapability =
  | "auto"
  | "manual"
  | "unavailable";

export type RestoreItem = {
  id: string;
  label: string;
  value: string;
  capability: RestoreCapability;
  detail: string;
};

export type ProjectRestorePreview = {
  state: NexusProjectSessionState;
  items: RestoreItem[];
  automaticCount: number;
  manualCount: number;
  unavailableCount: number;
};
