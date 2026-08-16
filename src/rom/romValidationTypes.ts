export type RomValidationSeverity =
  | "info"
  | "warning"
  | "error";

export type RomValidationIssue = {
  id: string;

  severity:
    RomValidationSeverity;

  title:
    string;

  detail:
    string;
};

export type RomByteChange = {
  offset:
    number;

  before:
    number;

  after:
    number;
};

export type RomValidationReport = {
  valid:
    boolean;

  issueCount:
    number;

  errors:
    number;

  warnings:
    number;

  infos:
    number;

  modifiedBytes:
    number;

  changedRanges:
    number;

  checksumStatus:
    "not-configured" |
    "unchanged" |
    "changed";

  generatedAt:
    string;

  issues:
    RomValidationIssue[];
};
