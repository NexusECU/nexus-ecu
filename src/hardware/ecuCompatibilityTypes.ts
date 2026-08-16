export type EcuCompatibilityVerdict =
  | "supported"
  | "provisional"
  | "limited"
  | "blocked"
  | "unknown";

export type EcuCompatibilityFactor = {
  id: string;

  label: string;

  passed: boolean;

  weight: number;

  detail: string;
};

export type EcuCompatibilityRecommendation = {
  priority:
    "high" |
    "medium" |
    "low";

  title: string;

  detail: string;
};

export type EcuCompatibilitySummary = {
  verdict:
    EcuCompatibilityVerdict;

  score: number;

  confidence:
    number;

  factors:
    EcuCompatibilityFactor[];

  recommendations:
    EcuCompatibilityRecommendation[];

  summaryText:
    string;
};
