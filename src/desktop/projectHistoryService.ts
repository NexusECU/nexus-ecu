import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import type {
  ProjectBackupRecord,
  ProjectHistoryEvent,
  ProjectHistoryEventType,
  ProjectRestorePoint,
} from "./projectHistoryTypes";

const HISTORY_KEY =
  "nexus.projectHistory.v8.6";

const RESTORE_KEY =
  "nexus.projectRestorePoints.v8.6";

const BACKUP_KEY =
  "nexus.projectBackups.v8.6";

function loadArray<T>(
  key:
    string,
): T[] {
  try {
    const raw =
      localStorage.getItem(
        key,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw,
      );

    return Array.isArray(
      parsed,
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveArray<T>(
  key:
    string,
  items:
    T[],
): void {
  localStorage.setItem(
    key,
    JSON.stringify(
      items,
    ),
  );
}

export function addProjectHistoryEvent(
  projectId:
    string,
  type:
    ProjectHistoryEventType,
  title:
    string,
  detail:
    string,
  metadata?: {
    [key: string]:
      string |
      number |
      boolean |
      null;
  },
): ProjectHistoryEvent {
  const events =
    loadArray<ProjectHistoryEvent>(
      HISTORY_KEY,
    );

  const event:
    ProjectHistoryEvent = {
      id:
        `history-${Date.now()}-${events.length}`,

      projectId,

      createdAt:
        new Date()
          .toISOString(),

      type,

      title,

      detail,

      metadata,
    };

  events.push(
    event,
  );

  saveArray(
    HISTORY_KEY,
    events,
  );

  return event;
}

export function listProjectHistory(
  projectId:
    string,
): ProjectHistoryEvent[] {
  return loadArray<ProjectHistoryEvent>(
    HISTORY_KEY,
  )
    .filter(
      event =>
        event.projectId ===
        projectId,
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.createdAt.localeCompare(
          a.createdAt,
        ),
    );
}

export function createProjectRestorePoint(
  projectId:
    string,
  label:
    string,
  session:
    NexusProjectSessionState,
): ProjectRestorePoint {
  const items =
    loadArray<ProjectRestorePoint>(
      RESTORE_KEY,
    );

  const restorePoint:
    ProjectRestorePoint = {
      id:
        `restore-${Date.now()}-${items.length}`,

      projectId,

      createdAt:
        new Date()
          .toISOString(),

      label:
        label.trim() ||
        "Manual Restore Point",

      sessionJson:
        JSON.stringify(
          session,
        ),
    };

  items.push(
    restorePoint,
  );

  saveArray(
    RESTORE_KEY,
    items,
  );

  addProjectHistoryEvent(
    projectId,
    "restore-point",
    "Restore point created",
    restorePoint.label,
  );

  return restorePoint;
}

export function listProjectRestorePoints(
  projectId:
    string,
): ProjectRestorePoint[] {
  return loadArray<ProjectRestorePoint>(
    RESTORE_KEY,
  )
    .filter(
      item =>
        item.projectId ===
        projectId,
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.createdAt.localeCompare(
          a.createdAt,
        ),
    );
}

export function restorePointSession(
  restorePoint:
    ProjectRestorePoint,
): NexusProjectSessionState | null {
  try {
    return JSON.parse(
      restorePoint.sessionJson,
    ) as NexusProjectSessionState;
  } catch {
    return null;
  }
}

export function addProjectBackupRecord(
  record:
    Omit<
      ProjectBackupRecord,
      "id" |
      "createdAt"
    >,
): ProjectBackupRecord {
  const items =
    loadArray<ProjectBackupRecord>(
      BACKUP_KEY,
    );

  const next:
    ProjectBackupRecord = {
      ...record,

      id:
        `project-backup-${Date.now()}-${items.length}`,

      createdAt:
        new Date()
          .toISOString(),
  };

  items.push(
    next,
  );

  saveArray(
    BACKUP_KEY,
    items,
  );

  addProjectHistoryEvent(
    record.projectId,
    "rom-backup",
    "ROM backup recorded",
    `${record.fileName} · ${record.sizeBytes.toLocaleString()} bytes`,
    {
      sha256:
        record.sha256,

      verified:
        record.verified,
    },
  );

  return next;
}

export function listProjectBackups(
  projectId:
    string,
): ProjectBackupRecord[] {
  return loadArray<ProjectBackupRecord>(
    BACKUP_KEY,
  )
    .filter(
      item =>
        item.projectId ===
        projectId,
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.createdAt.localeCompare(
          a.createdAt,
        ),
    );
}
