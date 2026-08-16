import type {
  TransportProviderId,
} from "../hardware/transportTypes";

export type ProjectConnectionProfile = {
  projectId:
    string;

  providerId:
    TransportProviderId;

  serialPort:
    string;

  serialBaud:
    number;

  canBitrateKbps:
    number;

  j2534DeviceName:
    string | null;

  j2534FunctionLibrary:
    string | null;

  lastSuccessfulAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};
