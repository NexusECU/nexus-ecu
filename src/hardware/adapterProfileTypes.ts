import type {
  TransportProviderId,
} from "./transportTypes";

export type AdapterSupportState =
  | "supported"
  | "bridge-required"
  | "platform-specific"
  | "planned"
  | "unavailable";

export type AdapterProfile = {
  providerId:
    TransportProviderId;

  displayName:
    string;

  family:
    string;

  supportState:
    AdapterSupportState;

  platforms:
    string[];

  driverRequirement:
    string;

  bridgeRequirement:
    string;

  protocols:
    string[];

  recommendedBaudRates:
    number[];

  passiveReceive:
    boolean;

  standardDiagnostics:
    boolean;

  romRead:
    boolean;

  romWrite:
    boolean;

  notes:
    string[];
};
