import type {
  TransportProviderId,
} from "./transportTypes";

export type ConnectionWizardResult =
  | "idle"
  | "testing"
  | "connected"
  | "partial"
  | "failed";

export type AdapterConnectionSettings = {
  providerId:
    TransportProviderId;

  serialPort:
    string;

  serialBaud:
    number;

  canBitrateKbps:
    number;

  autoBaud:
    boolean;
};

export type AdapterConnectionTestReport = {
  result:
    ConnectionWizardResult;

  title:
    string;

  detail:
    string;

  recommendations:
    string[];
};
