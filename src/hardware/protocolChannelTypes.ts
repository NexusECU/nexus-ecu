import type {
  TransportProviderId,
} from "./transportTypes";

export type ProtocolFamily =
  | "can"
  | "iso15765"
  | "j2534"
  | "elm"
  | "serial"
  | "unknown";

export type AddressingMode =
  | "11-bit"
  | "29-bit"
  | "mixed"
  | "unknown";

export type ChannelState =
  | "closed"
  | "opening"
  | "open"
  | "degraded"
  | "error";

export type ProtocolChannelSnapshot = {
  providerId:
    TransportProviderId;

  protocolFamily:
    ProtocolFamily;

  addressingMode:
    AddressingMode;

  state:
    ChannelState;

  bitrateKbps:
    number | null;

  responderIds:
    string[];

  frameCount:
    number;

  ready:
    boolean;

  statusText:
    string;
};

export type ProtocolChannelEvent = {
  id:
    string;

  timestamp:
    string;

  state:
    ChannelState;

  title:
    string;

  detail:
    string;
};
