import {
  invoke,
  isTauri,
} from "@tauri-apps/api/core";

import {
  open,
  save,
} from "@tauri-apps/plugin-dialog";

import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

import type {
  EcuMap,
} from "../maps/mapTypes";

import {
  APP_VERSION,
} from "../version";

import {
  NEXUS_PROJECT_SCHEMA,
  type CalibrationRevision,
  type NexusProject,
  type ProjectVehicleDetails,
  type RecentProject,
} from "./projectTypes";

const RECENT_PROJECTS_KEY =
  "nexus-ecu-recent-projects-v1";

function cloneMap(
  map: EcuMap,
): EcuMap {
  return {
    ...map,

    xAxis: {
      ...map.xAxis,
      values: [
        ...map.xAxis.values,
      ],
    },

    yAxis: {
      ...map.yAxis,
      values: [
        ...map.yAxis.values,
      ],
    },

    values:
      map.values.map(
        (row) => [
          ...row,
        ],
      ),
  };
}

function cloneMaps(
  maps:
    CalibrationSet["maps"],
): CalibrationSet["maps"] {
  return {
    fuel:
      cloneMap(
        maps.fuel,
      ),

    ignition:
      cloneMap(
        maps.ignition,
      ),

    boost:
      cloneMap(
        maps.boost,
      ),
  };
}

function projectId(): string {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in
      crypto
  ) {
    return crypto.randomUUID();
  }

  return (
    `nexus-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`
  );
}

export function defaultProjectVehicle():
  ProjectVehicleDetails {
  return {
    vin: "",
    make: "",
    model: "",
    year: "",
    engine: "",
    ecu: "",
    transmission: "",
    fuel: "",
    modifications: "",
  };
}

export function createRevision(
  name: string,
  maps: CalibrationSet["maps"],
  notes = "",
): CalibrationRevision {
  const now =
    new Date().toISOString();

  return {
    id:
      projectId(),
    name:
      name.trim() ||
      `Revision ${now.slice(0, 10)}`,
    createdAt:
      now,
    notes,
    maps:
      cloneMaps(maps),
  };
}

export function createNexusProject({
  name,
  vehicleProfileId,
  maps,
}: {
  name: string;

  vehicleProfileId:
    string;

  maps:
    CalibrationSet["maps"];
}): NexusProject {
  const now =
    new Date().toISOString();

  return {
    schemaVersion:
      NEXUS_PROJECT_SCHEMA,

    appVersion:
      APP_VERSION,

    id:
      projectId(),

    name,

    vehicleProfileId,

    createdAt:
      now,

    updatedAt:
      now,

    notes:
      "",

    tunerName:
      "",

    vehicle:
      defaultProjectVehicle(),

    favouriteMapIds:
      [],

    revisions:
      [],

    editHistory:
      [],

    maps:
      cloneMaps(
        maps,
      ),
  };
}

export function updateProjectSnapshot(
  project: NexusProject,
  maps:
    CalibrationSet["maps"],
  vehicleProfileId:
    string,
): NexusProject {
  return {
    ...project,

    schemaVersion:
      NEXUS_PROJECT_SCHEMA,

    appVersion:
      APP_VERSION,

    vehicleProfileId,

    updatedAt:
      new Date().toISOString(),

    maps:
      cloneMaps(
        maps,
      ),
  };
}

export function getRecentProjects():
  RecentProject[] {
  try {
    const raw =
      localStorage.getItem(
        RECENT_PROJECTS_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw,
      );

    if (
      !Array.isArray(
        parsed,
      )
    ) {
      return [];
    }

    return parsed
      .filter(
        (
          item,
        ): item is RecentProject =>
          typeof item?.name ===
            "string" &&
          typeof item?.path ===
            "string" &&
          typeof item?.openedAt ===
            "string",
      )
      .slice(
        0,
        8,
      );
  } catch {
    return [];
  }
}

function rememberProject(
  project: NexusProject,
  path: string,
): RecentProject[] {
  const next: RecentProject[] = [
    {
      name:
        project.name,

      path,

      openedAt:
        new Date().toISOString(),
    },

    ...getRecentProjects().filter(
      (item) =>
        item.path !== path,
    ),
  ].slice(
    0,
    8,
  );

  localStorage.setItem(
    RECENT_PROJECTS_KEY,
    JSON.stringify(
      next,
    ),
  );

  return next;
}

function validateProject(
  value: unknown,
): NexusProject {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "This is not a valid NEXUS ECU project.",
    );
  }

  const candidate =
    value as Partial<NexusProject>;

  if (
    (candidate.schemaVersion !== 1 &&
      candidate.schemaVersion !== 2) ||
    typeof candidate.name !== "string" ||
    typeof candidate.vehicleProfileId !== "string" ||
    !candidate.maps?.fuel ||
    !candidate.maps?.ignition ||
    !candidate.maps?.boost
  ) {
    throw new Error(
      "The project file is invalid or uses an unsupported schema.",
    );
  }

  return {
    ...(candidate as NexusProject),
    schemaVersion:
      NEXUS_PROJECT_SCHEMA,
    appVersion:
      typeof candidate.appVersion === "string"
        ? candidate.appVersion
        : APP_VERSION,
    notes:
      typeof candidate.notes === "string"
        ? candidate.notes
        : "",
    tunerName:
      typeof candidate.tunerName === "string"
        ? candidate.tunerName
        : "",
    vehicle:
      candidate.vehicle ?? defaultProjectVehicle(),
    favouriteMapIds:
      Array.isArray(candidate.favouriteMapIds)
        ? candidate.favouriteMapIds
        : [],
    revisions:
      Array.isArray(candidate.revisions)
        ? candidate.revisions
        : [],
    editHistory:
      Array.isArray(candidate.editHistory)
        ? candidate.editHistory
        : [],
  };
}

async function browserSave(
  project: NexusProject,
): Promise<string> {
  const blob =
    new Blob(
      [
        JSON.stringify(
          project,
          null,
          2,
        ),
      ],
      {
        type:
          "application/json",
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const link =
    document.createElement(
      "a",
    );

  link.href =
    url;

  link.download =
    `${project.name
      .trim()
      .replace(
        /[^a-z0-9-_ ]/gi,
        "",
      )
      .replace(
        /\s+/g,
        "-",
      ) || "nexus-project"}.nexus`;

  document.body.appendChild(
    link,
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url,
  );

  return link.download;
}

async function browserOpen():
  Promise<{
    project: NexusProject;
    path: string;
  } | null> {
  return new Promise(
    (resolve, reject) => {
      const input =
        document.createElement(
          "input",
        );

      input.type =
        "file";

      input.accept =
        ".nexus,application/json";

      input.onchange =
        async () => {
          const file =
            input.files?.[0];

          if (!file) {
            resolve(
              null,
            );

            return;
          }

          try {
            const text =
              await file.text();

            const project =
              validateProject(
                JSON.parse(
                  text,
                ),
              );

            resolve({
              project,

              path:
                file.name,
            });
          } catch (
            error
          ) {
            reject(
              error,
            );
          }
        };

      input.click();
    },
  );
}

export async function saveProjectAs(
  project: NexusProject,
): Promise<{
  project: NexusProject;
  path: string;
  recent: RecentProject[];
} | null> {
  const snapshot = {
    ...project,

    updatedAt:
      new Date().toISOString(),
  };

  if (
    !isTauri()
  ) {
    const path =
      await browserSave(
        snapshot,
      );

    return {
      project:
        snapshot,

      path,

      recent:
        rememberProject(
          snapshot,
          path,
        ),
    };
  }

  const path =
    await save({
      title:
        "Save NEXUS ECU Project",

      defaultPath:
        `${snapshot.name}.nexus`,

      filters: [
        {
          name:
            "NEXUS ECU Project",

          extensions: [
            "nexus",
          ],
        },
      ],
    });

  if (!path) {
    return null;
  }

  await invoke(
    "write_project_file",
    {
      path,

      contents:
        JSON.stringify(
          snapshot,
          null,
          2,
        ),
    },
  );

  return {
    project:
      snapshot,

    path,

    recent:
      rememberProject(
        snapshot,
        path,
      ),
  };
}

export async function saveProject(
  project: NexusProject,
  path: string,
): Promise<{
  project: NexusProject;
  recent: RecentProject[];
}> {
  const snapshot = {
    ...project,

    updatedAt:
      new Date().toISOString(),
  };

  if (
    !isTauri()
  ) {
    const browserPath =
      await browserSave(
        snapshot,
      );

    return {
      project:
        snapshot,

      recent:
        rememberProject(
          snapshot,
          browserPath,
        ),
    };
  }

  await invoke(
    "write_project_file",
    {
      path,

      contents:
        JSON.stringify(
          snapshot,
          null,
          2,
        ),
    },
  );

  return {
    project:
      snapshot,

    recent:
      rememberProject(
        snapshot,
        path,
      ),
  };
}

export async function openProject():
  Promise<{
    project: NexusProject;
    path: string;
    recent: RecentProject[];
  } | null> {
  if (
    !isTauri()
  ) {
    const result =
      await browserOpen();

    if (!result) {
      return null;
    }

    return {
      ...result,

      recent:
        rememberProject(
          result.project,
          result.path,
        ),
    };
  }

  const path =
    await open({
      title:
        "Open NEXUS ECU Project",

      multiple:
        false,

      directory:
        false,

      filters: [
        {
          name:
            "NEXUS ECU Project",

          extensions: [
            "nexus",
          ],
        },
      ],
    });

  if (
    !path ||
    Array.isArray(
      path,
    )
  ) {
    return null;
  }

  const contents =
    await invoke<string>(
      "read_project_file",
      {
        path,
      },
    );

  const project =
    validateProject(
      JSON.parse(
        contents,
      ),
    );

  return {
    project,

    path,

    recent:
      rememberProject(
        project,
        path,
      ),
  };
}

export async function openRecentProject(
  recent:
    RecentProject,
): Promise<{
  project: NexusProject;
  path: string;
  recent: RecentProject[];
}> {
  if (
    !isTauri()
  ) {
    throw new Error(
      "Recent projects can only be reopened directly in the desktop app.",
    );
  }

  const contents =
    await invoke<string>(
      "read_project_file",
      {
        path:
          recent.path,
      },
    );

  const project =
    validateProject(
      JSON.parse(
        contents,
      ),
    );

  return {
    project,

    path:
      recent.path,

    recent:
      rememberProject(
        project,
        recent.path,
      ),
  };
}
