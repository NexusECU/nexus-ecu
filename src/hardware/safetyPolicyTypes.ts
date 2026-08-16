export type SafetyDecision =
  | "allow"
  | "caution"
  | "block";

export type SafetyGate = {
  id: string;
  label: string;
  required: boolean;
  passed: boolean;
  detail: string;
};

export type SafetyPolicySummary = {
  decision: SafetyDecision;
  score: number;
  requiredPassed: number;
  requiredTotal: number;
  gates: SafetyGate[];
  blockedReasons: string[];
  cautionReasons: string[];
  summaryText: string;
};
