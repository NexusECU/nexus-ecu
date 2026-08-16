export type EcuMatchConfidence =
  | "high"
  | "medium"
  | "low"
  | "none";

export type EcuMatchEvidence = {
  label:
    string;

  matched:
    boolean;

  detail:
    string;
};

export type EcuDefinitionMatch = {
  definitionId:
    string;

  definitionName:
    string;

  romId:
    string;

  confidence:
    EcuMatchConfidence;

  score:
    number;

  evidence:
    EcuMatchEvidence[];
};

export type EcuCapabilityMatchSummary = {
  bestMatch:
    EcuDefinitionMatch | null;

  candidates:
    EcuDefinitionMatch[];

  identityReady:
    boolean;

  compatibilityText:
    string;
};
