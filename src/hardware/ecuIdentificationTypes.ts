export type EcuIdentification = {
  vin: string | null;
  calibrationIds: string[];
  cvns: string[];
  ecuNames: string[];
  supportedMode09Pids: number[];
  evidence: string[];
};

export type IdentificationRequest = {
  service: 0x09;
  pid: number;
  label: string;
  commandHex: string;
  readOnly: true;
};
