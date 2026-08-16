import {
  Archive,
  Clock3,
  FileClock,
  MessageSquareText,
  RotateCcw,
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
  addProjectBackupRecord,
  addProjectHistoryEvent,
  createProjectRestorePoint,
  listProjectBackups,
  listProjectHistory,
  listProjectRestorePoints,
  restorePointSession,
} from "./projectHistoryService";

import type {
  ProjectBackupRecord,
  ProjectHistoryEvent,
  ProjectRestorePoint,
} from "./projectHistoryTypes";

import "./project-history.css";

type Props = {
  activeProject:
    VehicleProjectProfile | null;

  currentSession:
    NexusProjectSessionState;

  onRestoreSession: (
    session:
      NexusProjectSessionState,
  ) => void;
};

export function ProjectHistoryPanel({
  activeProject,
  currentSession,
  onRestoreSession,
}: Props) {
  const [
    history,
    setHistory,
  ] = useState<
    ProjectHistoryEvent[]
  >([]);

  const [
    restorePoints,
    setRestorePoints,
  ] = useState<
    ProjectRestorePoint[]
  >([]);

  const [
    backups,
    setBackups,
  ] = useState<
    ProjectBackupRecord[]
  >([]);

  const [
    note,
    setNote,
  ] = useState("");

  const [
    restoreLabel,
    setRestoreLabel,
  ] = useState(
    "Manual Restore Point",
  );

  const refresh =
    () => {
      if (!activeProject) {
        setHistory([]);
        setRestorePoints([]);
        setBackups([]);
        return;
      }

      setHistory(
        listProjectHistory(
          activeProject.id,
        ),
      );

      setRestorePoints(
        listProjectRestorePoints(
          activeProject.id,
        ),
      );

      setBackups(
        listProjectBackups(
          activeProject.id,
        ),
      );
    };

  useEffect(
    () => {
      refresh();
    },
    [
      activeProject?.id,
    ],
  );

  if (!activeProject) {
    return (
      <section className="project-history-panel">
        <div className="project-history-empty">
          Open or create a vehicle project to start project
          history and backup tracking.
        </div>
      </section>
    );
  }

  const addNote =
    () => {
      const trimmed =
        note.trim();

      if (!trimmed) {
        return;
      }

      addProjectHistoryEvent(
        activeProject.id,
        "note",
        "Project note",
        trimmed,
      );

      setNote("");
      refresh();
    };

  const createRestorePoint =
    () => {
      createProjectRestorePoint(
        activeProject.id,
        restoreLabel,
        currentSession,
      );

      refresh();
    };

  const recordCurrentRom =
    () => {
      if (!currentSession.rom) {
        return;
      }

      addProjectBackupRecord({
        projectId:
          activeProject.id,

        fileName:
          currentSession.rom.fileName,

        sizeBytes:
          currentSession.rom.sizeBytes,

        sha256:
          currentSession.rom.sha256,

        source:
          "loaded-rom",

        verified:
          true,
      });

      refresh();
    };

  return (
    <section className="project-history-panel">
      <div className="project-history-header">
        <div>
          <FileClock
            size={16}
          />

          <div>
            <span className="eyebrow">
              PROJECT HISTORY & ROM BACKUPS · V8.6
            </span>

            <h3>
              {activeProject.name}
            </h3>
          </div>
        </div>

        <strong>
          {history.length}
          {" "}
          EVENT
          {history.length === 1
            ? ""
            : "S"}
        </strong>
      </div>

      <div className="project-history-stats">
        <Stat
          label="HISTORY"
          value={
            history.length
          }
        />

        <Stat
          label="RESTORE POINTS"
          value={
            restorePoints.length
          }
        />

        <Stat
          label="ROM BACKUPS"
          value={
            backups.length
          }
        />
      </div>

      <div className="project-history-actions">
        <div>
          <span>
            ADD PROJECT NOTE
          </span>

          <textarea
            value={
              note
            }
            placeholder="Add a note to this vehicle project…"
            onChange={
              event =>
                setNote(
                  event.target.value,
                )
            }
          />

          <button
            type="button"
            onClick={
              addNote
            }
          >
            <MessageSquareText
              size={12}
            />

            ADD NOTE
          </button>
        </div>

        <div>
          <span>
            CREATE RESTORE POINT
          </span>

          <input
            value={
              restoreLabel
            }
            onChange={
              event =>
                setRestoreLabel(
                  event.target.value,
                )
            }
          />

          <button
            type="button"
            onClick={
              createRestorePoint
            }
          >
            <Save
              size={12}
            />

            CREATE RESTORE POINT
          </button>
        </div>

        <div>
          <span>
            ROM BACKUP RECORD
          </span>

          <strong>
            {currentSession.rom?.fileName ??
              "NO ROM LOADED"}
          </strong>

          <button
            type="button"
            disabled={
              !currentSession.rom
            }
            onClick={
              recordCurrentRom
            }
          >
            <Archive
              size={12}
            />

            RECORD CURRENT ROM BACKUP
          </button>
        </div>
      </div>

      <div className="project-history-layout">
        <div className="project-history-timeline">
          <div className="project-history-section-title">
            <Clock3
              size={12}
            />

            PROJECT TIMELINE
          </div>

          {history.length ? (
            history.map(
              event => (
                <div
                  key={
                    event.id
                  }
                  className={`project-history-event ${event.type}`}
                >
                  <span>
                    {new Date(
                      event.createdAt,
                    ).toLocaleString()}
                  </span>

                  <strong>
                    {event.title}
                  </strong>

                  <em>
                    {event.detail}
                  </em>
                </div>
              ),
            )
          ) : (
            <div className="project-history-empty">
              No project history recorded yet.
            </div>
          )}
        </div>

        <div className="project-history-side">
          <div className="project-history-side-block">
            <div className="project-history-section-title">
              RESTORE POINTS
            </div>

            {restorePoints.length ? (
              restorePoints.map(
                point => (
                  <div
                    key={
                      point.id
                    }
                    className="project-restore-point"
                  >
                    <div>
                      <strong>
                        {point.label}
                      </strong>

                      <span>
                        {new Date(
                          point.createdAt,
                        ).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const session =
                          restorePointSession(
                            point,
                          );

                        if (session) {
                          onRestoreSession(
                            session,
                          );
                        }
                      }}
                    >
                      <RotateCcw
                        size={11}
                      />

                      RESTORE
                    </button>
                  </div>
                ),
              )
            ) : (
              <div className="project-history-empty">
                No restore points yet.
              </div>
            )}
          </div>

          <div className="project-history-side-block">
            <div className="project-history-section-title">
              ROM BACKUPS
            </div>

            {backups.length ? (
              backups.map(
                backup => (
                  <div
                    key={
                      backup.id
                    }
                    className="project-backup-record"
                  >
                    <strong>
                      {backup.fileName}
                    </strong>

                    <span>
                      {backup.sizeBytes.toLocaleString()}
                      {" "}
                      bytes
                    </span>

                    <span>
                      {backup.sha256.slice(
                        0,
                        16,
                      )}
                      …
                    </span>

                    <em>
                      {backup.verified
                        ? "VERIFIED"
                        : "NOT VERIFIED"}
                    </em>
                  </div>
                ),
              )
            ) : (
              <div className="project-history-empty">
                No ROM backups recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="project-history-footer">
        v8.6 stores backup metadata and session restore points.
        It does not duplicate ROM binary bytes into browser
        storage and does not perform ECU reads or writes.
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
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
