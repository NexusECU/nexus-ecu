import type {
  TransportProviderId,
} from "./transportTypes";

export type ReadOnlyIdentityConfidence =
  | "none"
  | "partial"
  | "observed";

export type ReadOnlyHardwareSnapshot = {
  providerId:
    TransportProviderId;

  connected:
    boolean;

  canMonitorActive:
    boolean;

  bitrateKbps:
    number | null;

  frameCount:
    number;

  uniqueCanIds:
    number;

  standardFrames:
    number;

  extendedFrames:
    number;

  remoteFrames:
    number;

  diagnosticResponseIds:
    string[];

  diagnosticRequestIds:
    string[];

  framesPerSecond:
    number;

  bytesReceived:
    number;

  lastActivityMs:
    number | null;

  identityConfidence:
    ReadOnlyIdentityConfidence;

  identitySummary:
    string;

  protocolEvidence:
    string[];
};
