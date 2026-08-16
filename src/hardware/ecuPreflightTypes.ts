export type EcuPreflightVerdict =
  | "ready"
  | "caution"
  | "blocked";

export type EcuPreflightCheck = {
  id: string;
  label: string;
  required: boolean;
  passed: boolean;
  detail: string;
};

export type EcuPreflightSummary = {
  verdict: EcuPreflightVerdict;
  passedCount: number;
  totalCount: number;
  requiredBlockedCount: number;
  checks: EcuPreflightCheck[];
  summaryText: string;
};
