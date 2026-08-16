import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import type {
  VehicleProjectIndex,
  VehicleProjectProfile,
} from "./vehicleProjectTypes";

const STORAGE_KEY =
  "nexus.vehicleProjects.v8.5";

function loadIndex():
  VehicleProjectIndex {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return {
        schemaVersion:
          1,

        activeProjectId:
          null,

        projects:
          [],
      };
    }

    const parsed =
      JSON.parse(
        raw,
      ) as VehicleProjectIndex;

    if (
      parsed.schemaVersion !==
      1
    ) {
      throw new Error(
        "Unsupported vehicle project index schema.",
      );
    }

    return parsed;
  } catch {
    return {
      schemaVersion:
        1,

      activeProjectId:
        null,

      projects:
        [],
    };
  }
}

function saveIndex(
  index:
    VehicleProjectIndex,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      index,
    ),
  );
}

export function listVehicleProjects():
  VehicleProjectProfile[] {
  return loadIndex()
    .projects
    .slice()
    .sort(
      (
        a,
        b,
      ) =>
        b.updatedAt.localeCompare(
          a.updatedAt,
        ),
    );
}

export function getActiveVehicleProject():
  VehicleProjectProfile | null {
  const index =
    loadIndex();

  if (
    !index.activeProjectId
  ) {
    return null;
  }

  return (
    index.projects.find(
      project =>
        project.id ===
        index.activeProjectId,
    ) ??
    null
  );
}

export function createVehicleProject(
  session:
    NexusProjectSessionState,
  name:
    string,
  vehicleLabel:
    string,
  notes:
    string,
): VehicleProjectProfile {
  const index =
    loadIndex();

  const now =
    new Date()
      .toISOString();

  const project:
    VehicleProjectProfile = {
      id:
        `vehicle-project-${Date.now()}`,

      name:
        name.trim() ||
        "Untitled NEXUS Project",

      createdAt:
        now,

      updatedAt:
        now,

      vehicleLabel:
        vehicleLabel.trim() ||
        "Unknown Vehicle",

      vin:
        session.hardware.identity.vin,

      ecuLabel:
        session.hardware.selectedEcuAddress ||
        "AUTO",

      calibrationId:
        session.hardware.identity.calibrationIds[0] ??
        null,

      notes:
        notes.trim(),

      session,
    };

  index.projects.push(
    project,
  );

  index.activeProjectId =
    project.id;

  saveIndex(
    index,
  );

  return project;
}

export function updateVehicleProject(
  projectId:
    string,
  session:
    NexusProjectSessionState,
  changes?: {
    name?:
      string;

    vehicleLabel?:
      string;

    notes?:
      string;
  },
): VehicleProjectProfile | null {
  const index =
    loadIndex();

  const project =
    index.projects.find(
      item =>
        item.id ===
        projectId,
    );

  if (!project) {
    return null;
  }

  project.updatedAt =
    new Date()
      .toISOString();

  project.session =
    session;

  project.vin =
    session.hardware.identity.vin;

  project.ecuLabel =
    session.hardware.selectedEcuAddress ||
    "AUTO";

  project.calibrationId =
    session.hardware.identity.calibrationIds[0] ??
    null;

  if (
    changes?.name !==
    undefined
  ) {
    project.name =
      changes.name;
  }

  if (
    changes?.vehicleLabel !==
    undefined
  ) {
    project.vehicleLabel =
      changes.vehicleLabel;
  }

  if (
    changes?.notes !==
    undefined
  ) {
    project.notes =
      changes.notes;
  }

  index.activeProjectId =
    project.id;

  saveIndex(
    index,
  );

  return project;
}

export function activateVehicleProject(
  projectId:
    string,
): VehicleProjectProfile | null {
  const index =
    loadIndex();

  const project =
    index.projects.find(
      item =>
        item.id ===
        projectId,
    );

  if (!project) {
    return null;
  }

  index.activeProjectId =
    project.id;

  saveIndex(
    index,
  );

  return project;
}

export function deleteVehicleProject(
  projectId:
    string,
): void {
  const index =
    loadIndex();

  index.projects =
    index.projects.filter(
      item =>
        item.id !==
        projectId,
    );

  if (
    index.activeProjectId ===
    projectId
  ) {
    index.activeProjectId =
      null;
  }

  saveIndex(
    index,
  );
}
