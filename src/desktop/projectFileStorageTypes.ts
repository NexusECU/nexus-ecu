import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

export type ProjectDiskManifest = {
  schemaVersion:
    1;

  projectId:
    string;

  projectName:
    string;

  vehicleLabel:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  session:
    NexusProjectSessionState;

  romBackups:
    Array<{
      fileName:
        string;

      relativePath:
        string;

      sizeBytes:
        number;

      sha256:
        string;

      createdAt:
        string;
    }>;

  restorePoints:
    Array<{
      label:
        string;

      relativePath:
        string;

      createdAt:
        string;
    }>;
};

export type ProjectDiskWriteResult = {
  projectDirectory:
    string;

  manifestPath:
    string;
};

export type ProjectDiskBackupResult = {
  filePath:
    string;

  fileName:
    string;

  sizeBytes:
    number;

  sha256:
    string;
};
