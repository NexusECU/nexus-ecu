export type OperatingMode =
  | "simulator"
  | "live";

export type SerialDeviceInfo = {
  portName: string;

  portType: string;

  vid:
    number | null;

  pid:
    number | null;

  serialNumber:
    string | null;

  manufacturer:
    string | null;

  product:
    string | null;
};

export type HardwareConnectionInfo = {
  connected: boolean;

  portName:
    string | null;

  baudRate:
    number | null;

  bytesReceived: number;
};
