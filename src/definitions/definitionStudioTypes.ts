export type DefinitionValidationIssue = {
  id: string;

  severity:
    "error" |
    "warning";

  definitionId:
    string | null;

  message:
    string;
};

export type DefinitionStudioState = {
  selectedId:
    string | null;

  dirty:
    boolean;

  issues:
    DefinitionValidationIssue[];
};

export type AddressRange = {
  definitionId:
    string;

  start:
    number;

  end:
    number;

  label:
    string;
};
