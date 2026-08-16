export type ElmAdapterInfo = {
  connected: boolean;

  portName: string;

  baudRate: number;

  version: string | null;

  description: string | null;

  identifier: string | null;

  voltage: string | null;

  protocol: string | null;

  protocolNumber: string | null;

  adapterFamily:
    "ELM"
    | "STN"
    | "OBDLINK"
    | "UNKNOWN";

  healthy: boolean;

  warnings: string[];
};
