export type HardwareDiagnosticStatus =
  | "pass"
  | "fail"
  | "warning"
  | "unknown";

export type HardwareDiagnosticCheck = {
  id: string;
  label: string;
  status: HardwareDiagnosticStatus;
  detail: string;
};

export type HardwareReadinessReport = {
  generatedAt: string;
  ready: boolean;
  passed: number;
  failed: number;
  warnings: number;
  unknown: number;
  checks: HardwareDiagnosticCheck[];
};
