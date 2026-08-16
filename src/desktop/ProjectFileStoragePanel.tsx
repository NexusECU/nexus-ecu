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

import {
  getProjectStorageRoot,
  writeProjectManifestToDisk,
  writeRestorePointToDisk,
} from "./projectFileStorageService";

import "./project-file-storage.css";

type Props = {
  activeProject:
    VehicleProjectProfile | null;

  currentSession:
    NexusProjectSessionState;
};

export function ProjectFileStoragePanel({
  activeProject,
  currentSession,
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
        v8.7 writes project metadata and restore points to real
        files through Tauri. ROM backup binaries can now be
        written to the project folder by the file backend, but
        this does not add ECU memory-read or write commands.
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
