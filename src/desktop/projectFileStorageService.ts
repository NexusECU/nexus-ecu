import {
  invoke,
} from "@tauri-apps/api/core";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import type {
  ProjectDiskBackupResult,
  ProjectDiskManifest,
  ProjectDiskWriteResult,
} from "./projectFileStorageTypes";

export async function writeProjectManifestToDisk(
  projectId:
    string,
  projectName:
    string,
  vehicleLabel:
    string,
  session:
    NexusProjectSessionState,
): Promise<ProjectDiskWriteResult> {
  const manifest:
    ProjectDiskManifest = {
      schemaVersion:
        1,

      projectId,

      projectName,

      vehicleLabel,

      createdAt:
        new Date()
          .toISOString(),

      updatedAt:
        new Date()
          .toISOString(),

      session,

      romBackups:
        [],

      restorePoints:
        [],
    };

  return invoke<ProjectDiskWriteResult>(
    "write_project_manifest",
    {
      projectId,

      manifestJson:
        JSON.stringify(
          manifest,
          null,
          2,
        ),
    },
  );
}

export async function writeRestorePointToDisk(
  projectId:
    string,
  label:
    string,
  session:
    NexusProjectSessionState,
): Promise<string> {
  return invoke<string>(
    "write_project_restore_point",
    {
      projectId,

      label,

      sessionJson:
        JSON.stringify(
          session,
          null,
          2,
        ),
    },
  );
}

export async function writeRomBackupToDisk(
  projectId:
    string,
  fileName:
    string,
  bytes:
    Uint8Array,
): Promise<ProjectDiskBackupResult> {
  return invoke<ProjectDiskBackupResult>(
    "write_project_rom_backup",
    {
      projectId,

      fileName,

      bytes:
        Array.from(
          bytes,
        ),
    },
  );
}

export async function getProjectStorageRoot():
  Promise<string> {
  return invoke<string>(
    "get_project_storage_root",
  );
}
