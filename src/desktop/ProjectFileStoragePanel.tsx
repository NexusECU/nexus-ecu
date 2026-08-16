import {
  FileJson2,
  FolderOpen,
  HardDrive,
  Save,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import type {
  VehicleProjectProfile,
} from "./vehicleProjectTypes";

import type {
  RomImageInfo,
} from "../rom/romTypes";

import {
  getProjectStorageRoot,
  writeProjectManifestToDisk,
  writeRestorePointToDisk,
  writeRomBackupAndSyncManifest,
} from "./projectFileStorageService";

import "./project-file-storage.css";

type Props = {
  activeProject:
    VehicleProjectProfile | null;

  currentSession:
    NexusProjectSessionState;

  loadedRomImage:
    RomImageInfo | null;
};

export function ProjectFileStoragePanel({
  activeProject,
  currentSession,
  loadedRomImage,
}: Props) {
  const [
    storageRoot,
    setStorageRoot,
  ] = useState(
    "UNKNOWN",
  );

  const [
    lastManifestPath,
    setLastManifestPath,
  ] = useState<
    string | null
  >(
    null,
  );

  const [
    lastRestorePointPath,
    setLastRestorePointPath,
  ] = useState<
    string | null
  >(
    null,
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(
    null,
  );


  const [
    lastRomBackupPath,
    setLastRomBackupPath,
  ] = useState<
    string | null
  >(
    null,
  );

  const [
    lastRomBackupHash,
    setLastRomBackupHash,
  ] = useState<
    string | null
  >(
    null,
  );

  useEffect(
    () => {
      void getProjectStorageRoot()
        .then(
          setStorageRoot,
        )
        .catch(
          caught =>
            setError(
              caught instanceof
              Error
                ? caught.message
                : String(
                    caught,
                  ),
            ),
        );
    },
    [],
  );

  const saveManifest =
    async () => {
      if (
        !activeProject
      ) {
        return;
      }

      setError(
        null,
      );

      try {
        const result =
          await writeProjectManifestToDisk(
            activeProject.id,
            activeProject.name,
            activeProject.vehicleLabel,
            currentSession,
          );

        setLastManifestPath(
          result.manifestPath,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof
          Error
            ? caught.message
            : String(
                caught,
              ),
        );
      }
    };

  const createRestoreFile =
    async () => {
      if (
        !activeProject
      ) {
        return;
      }

      setError(
        null,
      );

      try {
        const path =
          await writeRestorePointToDisk(
            activeProject.id,
            `restore-${new Date()
              .toISOString()
              .replace(
                /[:.]/g,
                "-",
              )}`,
            currentSession,
          );

        setLastRestorePointPath(
          path,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof
          Error
            ? caught.message
            : String(
                caught,
              ),
        );
      }
    };

  const writeCurrentRomBackup =
    async () => {
      if (
        !activeProject ||
        !loadedRomImage
      ) {
        return;
      }

      setError(
        null,
      );

      try {
        const result =
          await writeRomBackupAndSyncManifest(
            activeProject.id,
            activeProject.name,
            activeProject.vehicleLabel,
            currentSession,
            loadedRomImage.fileName,
            new Uint8Array(
              loadedRomImage.bytes,
            ),
          );

        setLastRomBackupPath(
          result.backup.filePath,
        );

        setLastRomBackupHash(
          result.backup.sha256,
        );

        setLastManifestPath(
          result.manifest.manifestPath,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof
          Error
            ? caught.message
            : String(
                caught,
              ),
        );
      }
    };

  return (
    <section className="project-file-storage">
      <div className="project-file-storage-header">
        <div>
          <HardDrive
            size={16}
          />

          <div>
            <span className="eyebrow">
              PROJECT FILE STORAGE · V8.7
            </span>

            <h3>
              Real On-Disk Project Storage
            </h3>
          </div>
        </div>

        <strong>
          TAURI FILE BACKEND
        </strong>
      </div>

      <div className="project-file-storage-grid">
        <Info
          label="STORAGE ROOT"
          value={
            storageRoot
          }
        />

        <Info
          label="ACTIVE PROJECT"
          value={
            activeProject?.name ??
            "NONE"
          }
        />

        <Info
          label="MANIFEST"
          value={
            lastManifestPath ??
            "NOT WRITTEN"
          }
        />

        <Info
          label="RESTORE FILE"
          value={
            lastRestorePointPath ??
            "NOT WRITTEN"
          }
        />

        <Info
          label="ROM BACKUP"
          value={
            lastRomBackupPath ??
            "NOT WRITTEN"
          }
        />

        <Info
          label="ROM SHA-256"
          value={
            lastRomBackupHash ??
            "NONE"
          }
        />
      </div>

      <div className="project-file-storage-actions">
        <button
          type="button"
          disabled={
            !activeProject
          }
          onClick={() =>
            void saveManifest()
          }
        >
          <FileJson2
            size={12}
          />

          WRITE PROJECT MANIFEST
        </button>

        <button
          type="button"
          disabled={
            !activeProject
          }
          onClick={() =>
            void createRestoreFile()
          }
        >
          <Save
            size={12}
          />

          WRITE RESTORE POINT FILE
        </button>

        <button
          type="button"
          disabled={
            !activeProject ||
            !loadedRomImage
          }
          onClick={() =>
            void writeCurrentRomBackup()
          }
        >
          <HardDrive
            size={12}
          />

          WRITE ROM BACKUP TO DISK
        </button>
      </div>

      {error && (
        <div className="project-file-storage-error">
          {error}
        </div>
      )}

      <div className="project-file-storage-structure">
        <div className="project-file-storage-title">
          <FolderOpen
            size={12}
          />

          PROJECT FOLDER STRUCTURE
        </div>

        <pre>{`NEXUS ECU/
└─ Projects/
   └─ <project-id>/
      ├─ manifest.json
      ├─ restore-points/
      │  └─ *.json
      └─ rom-backups/
         └─ *.bin`}</pre>
      </div>

      <div className="project-file-storage-note">
        v8.8 writes the currently loaded ROM image to the
        active project’s rom-backups folder, hashes it with
        SHA-256 in the Rust backend, and updates the project
        manifest. ECU memory-read, security access and write/
        flash commands remain unavailable.
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
