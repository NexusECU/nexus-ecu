import {
  Archive,
  FileJson2,
  FolderOpen,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  VehicleProjectProfile,
} from "./vehicleProjectTypes";

import type {
  ProjectBrowserEntry,
  ProjectBrowserSnapshot,
} from "./projectBrowserTypes";

import {
  browseProjectFiles,
  readProjectTextFile,
} from "./projectBrowserService";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import "./project-browser.css";

type Props = {
  activeProject:
    VehicleProjectProfile | null;

  onRestoreSession: (
    session:
      NexusProjectSessionState,
  ) => void;
};

export function ProjectBrowserPanel({
  activeProject,
  onRestoreSession,
}: Props) {
  const [
    snapshot,
    setSnapshot,
  ] = useState<
    ProjectBrowserSnapshot | null
  >(
    null,
  );

  const [
    selected,
    setSelected,
  ] = useState<
    ProjectBrowserEntry | null
  >(
    null,
  );

  const [
    preview,
    setPreview,
  ] = useState(
    "",
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(
    null,
  );

  const refresh =
    async () => {
      if (!activeProject) {
        setSnapshot(
          null,
        );

        setSelected(
          null,
        );

        setPreview(
          "",
        );

        return;
      }

      setError(
        null,
      );

      try {
        const next =
          await browseProjectFiles(
            activeProject.id,
          );

        setSnapshot(
          next,
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

  useEffect(
    () => {
      void refresh();
    },
    [
      activeProject?.id,
    ],
  );

  const openEntry =
    async (
      entry:
        ProjectBrowserEntry,
    ) => {
      setSelected(
        entry,
      );

      setPreview(
        "",
      );

      if (
        entry.entryType ===
        "rom-backup"
      ) {
        return;
      }

      try {
        const text =
          await readProjectTextFile(
            entry.path,
          );

        setPreview(
          text,
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

  const restoreSelected =
    () => {
      if (
        !selected ||
        selected.entryType !==
          "restore-point" ||
        !preview
      ) {
        return;
      }

      try {
        const parsed =
          JSON.parse(
            preview,
          ) as NexusProjectSessionState;

        onRestoreSession(
          parsed,
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

  if (!activeProject) {
    return (
      <section className="project-browser-panel">
        <div className="project-browser-empty">
          Open a vehicle project to browse its on-disk files.
        </div>
      </section>
    );
  }

  return (
    <section className="project-browser-panel">
      <div className="project-browser-header">
        <div>
          <FolderOpen
            size={16}
          />

          <div>
            <span className="eyebrow">
              PROJECT BROWSER & BACKUP EXPLORER
            </span>

            <h3>
              {activeProject.name}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void refresh()
          }
        >
          <RefreshCcw
            size={12}
          />

          REFRESH
        </button>
      </div>

      <div className="project-browser-path">
        <span>
          PROJECT DIRECTORY
        </span>

        <strong>
          {snapshot?.projectDirectory ??
            "UNKNOWN"}
        </strong>
      </div>

      <div className="project-browser-layout">
        <div className="project-browser-list">
          {snapshot?.entries.length ? (
            snapshot.entries.map(
              entry => (
                <button
                  type="button"
                  key={
                    entry.path
                  }
                  className={
                    selected?.path ===
                    entry.path
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    void openEntry(
                      entry,
                    )
                  }
                >
                  <div>
                    {entry.entryType ===
                    "manifest" ? (
                      <FileJson2
                        size={12}
                      />
                    ) : entry.entryType ===
                      "restore-point" ? (
                      <RotateCcw
                        size={12}
                      />
                    ) : (
                      <Archive
                        size={12}
                      />
                    )}
                  </div>

                  <div>
                    <strong>
                      {entry.name}
                    </strong>

                    <span>
                      {entry.entryType
                        .replace(
                          "-",
                          "",
                        )
                        .toUpperCase()}
                    </span>

                    <em>
                      {entry.sizeBytes.toLocaleString()}
                      {""}
                      bytes
                      {" · "}
                      {new Date(
                        entry.modifiedAt,
                      ).toLocaleString()}
                    </em>
                  </div>
                </button>
              ),
            )
          ) : (
            <div className="project-browser-empty">
              No on-disk project files found yet.
            </div>
          )}
        </div>

        <div className="project-browser-preview">
          <div className="project-browser-preview-header">
            <strong>
              {selected?.name ??
                "NO FILE SELECTED"}
            </strong>

            {selected?.entryType ===
              "restore-point" && (
              <button
                type="button"
                onClick={
                  restoreSelected
                }
              >
                <RotateCcw
                  size={11}
                />

                RESTORE SESSION
              </button>
            )}
          </div>

          {selected?.entryType ===
          "rom-backup" ? (
            <div className="project-browser-binary">
              <Archive
                size={28}
              />

              <strong>
                ROM BACKUP FILE
              </strong>

              <span>
                {selected.path}
              </span>

              <em>
                Binary preview is intentionally disabled.
              </em>
            </div>
          ) : (
            <pre>
              {preview ||
                "Select a manifest or restore point to preview its contents."}
            </pre>
          )}
        </div>
      </div>

      {error && (
        <div className="project-browser-error">
          {error}
        </div>
      )}

      <div className="project-browser-footer"> browses files already stored in the active project
        directory. It does not modify or transmit ECU memory.
      </div>
    </section>
  );
}
