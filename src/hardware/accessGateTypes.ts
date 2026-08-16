import type {
  NexusAccessMode,
} from "../desktop/accessModeSettings";

export type AccessGateCheck = {
  id: string;
  label: string;
  passed: boolean;
  requiredFor:
    NexusAccessMode[];
  detail: string;
};

export type AccessGateSummary = {
  requestedMode:
    NexusAccessMode;

  effectiveMode:
    NexusAccessMode;

  allowed:
    boolean;

  checks:
    AccessGateCheck[];

  blockers:
    string[];

  summaryText:
    string;
};
