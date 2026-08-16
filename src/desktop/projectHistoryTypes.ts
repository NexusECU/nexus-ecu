export type ProjectHistoryEventType =
  | "session"
  | "identity"
  | "rom-backup"
  | "calibration"
  | "note"
  | "restore-point";

export type ProjectHistoryEvent = {
  id: string;

  projectId: string;

  createdAt: string;

  type:
    ProjectHistoryEventType;

  title: string;

  detail: string;

  metadata?: {
    [key: string]:
      string |
      number |
      boolean |
      null;
  };
};

export type ProjectRestorePoint = {
  id: string;

  projectId: string;

  createdAt: string;

  label: string;

  sessionJson: string;
};

export type ProjectBackupRecord = {
  id: string;

  projectId: string;

  createdAt: string;

  fileName: string;

  sizeBytes: number;

  sha256: string;

  source:
    "loaded-rom"
    | "session";

  verified: boolean;
};
