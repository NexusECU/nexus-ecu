export type ReleaseReadinessStatus =
  | "ready"
  | "attention"
  | "blocked";

export type ReleaseReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
  detail: string;
};

export type ReleaseReadinessSummary = {
  status: ReleaseReadinessStatus;
  score: number;
  checks: ReleaseReadinessCheck[];
  requiredBlocked: number;
  summaryText: string;
};
