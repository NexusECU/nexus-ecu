export type ProjectBrowserEntryType =
  | "manifest"
  | "restore-point"
  | "rom-backup";

export type ProjectBrowserEntry = {
  entryType:
    ProjectBrowserEntryType;

  name:
    string;

  path:
    string;

  sizeBytes:
    number;

  modifiedAt:
    string;
};

export type ProjectBrowserSnapshot = {
  projectDirectory:
    string;

  entries:
    ProjectBrowserEntry[];
};
