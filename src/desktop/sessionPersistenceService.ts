import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

const STORAGE_KEY =
  "nexus.projectSession.v8.3";

export function saveProjectSessionState(
  state:
    NexusProjectSessionState,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      state,
    ),
  );
}

export function loadProjectSessionState():
  NexusProjectSessionState | null {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as NexusProjectSessionState;

    if (
      parsed.schemaVersion !==
      1
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearProjectSessionState():
  void {
  localStorage.removeItem(
    STORAGE_KEY,
  );
}
