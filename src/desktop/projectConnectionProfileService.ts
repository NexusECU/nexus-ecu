import type {
  ProjectConnectionProfile,
} from "./projectConnectionProfileTypes";

const STORAGE_KEY =
  "nexus.projectConnectionProfiles.v9.1";

function loadProfiles():
  ProjectConnectionProfile[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
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

function saveProfiles(
  profiles:
    ProjectConnectionProfile[],
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      profiles,
    ),
  );
}

export function getProjectConnectionProfile(
  projectId:
    string,
): ProjectConnectionProfile | null {
  return (
    loadProfiles().find(
      profile =>
        profile.projectId ===
        projectId,
    ) ??
    null
  );
}

export function saveProjectConnectionProfile(
  profile:
    ProjectConnectionProfile,
): ProjectConnectionProfile {
  const profiles =
    loadProfiles();

  const index =
    profiles.findIndex(
      item =>
        item.projectId ===
        profile.projectId,
    );

  const now =
    new Date()
      .toISOString();

  const next:
    ProjectConnectionProfile = {
      ...profile,

      createdAt:
        index >= 0
          ? profiles[index].createdAt
          : profile.createdAt ||
            now,

      updatedAt:
        now,
  };

  if (
    index >= 0
  ) {
    profiles[index] =
      next;
  } else {
    profiles.push(
      next,
    );
  }

  saveProfiles(
    profiles,
  );

  return next;
}

export function markProjectConnectionSuccessful(
  projectId:
    string,
): ProjectConnectionProfile | null {
  const profiles =
    loadProfiles();

  const index =
    profiles.findIndex(
      item =>
        item.projectId ===
        projectId,
    );

  if (
    index <
    0
  ) {
    return null;
  }

  profiles[index] = {
    ...profiles[index],

    lastSuccessfulAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString(),
  };

  saveProfiles(
    profiles,
  );

  return profiles[index];
}

export function deleteProjectConnectionProfile(
  projectId:
    string,
): void {
  saveProfiles(
    loadProfiles().filter(
      profile =>
        profile.projectId !==
        projectId,
    ),
  );
}
