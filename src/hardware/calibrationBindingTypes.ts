export type CalibrationBindingStatus =
  | "verified"
  | "partial"
  | "mismatch"
  | "unbound";

export type CalibrationBindingCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type CalibrationBindingSummary = {
  status: CalibrationBindingStatus;
  score: number;
  checks: CalibrationBindingCheck[];
  projectLabel: string;
  vin: string | null;
  calibrationId: string | null;
  definitionName: string | null;
  definitionRomId: string | null;
  romFileName: string | null;
  romSha256: string | null;
  summaryText: string;
};
