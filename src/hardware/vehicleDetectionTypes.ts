export type DetectionConfidence =
  | "detected"
  | "inferred"
  | "unknown";

export type DetectionField = {
  label: string;
  value: string;
  confidence: DetectionConfidence;
  evidence: string;
};

export type VehicleDetectionSnapshot = {
  vehicle: DetectionField[];
  network: DetectionField[];
  ecu: DetectionField[];
  calibration: DetectionField[];
};
