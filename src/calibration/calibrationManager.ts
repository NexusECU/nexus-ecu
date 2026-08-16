import type { EcuMap } from "../maps/mapTypes";

export interface CalibrationSet {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;

  maps: {
    fuel: EcuMap;
    ignition: EcuMap;
    boost: EcuMap;
  };
}

export interface CalibrationChange {
  id: string;
  timestamp: string;
  mapId: string;
  mapName: string;
  row: number;
  column: number;
  oldValue: number;
  newValue: number;
}

export interface CalibrationSnapshot {
  id: string;
  name: string;
  createdAt: string;

  maps: {
    fuel: EcuMap;
    ignition: EcuMap;
    boost: EcuMap;
  };
}

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

    values: map.values.map(
      (row) => [...row],
    ),
  };
}

export function cloneCalibrationMaps(
  maps: CalibrationSet["maps"],
): CalibrationSet["maps"] {
  return {
    fuel: cloneMap(maps.fuel),
    ignition: cloneMap(maps.ignition),
    boost: cloneMap(maps.boost),
  };
}

export function createCalibration(
  name: string,
  description: string,
  maps: CalibrationSet["maps"],
): CalibrationSet {
  const now =
    new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: now,
    updatedAt: now,

    maps: cloneCalibrationMaps(
      maps,
    ),
  };
}

export function updateCalibration(
  calibration: CalibrationSet,
  maps: CalibrationSet["maps"],
): CalibrationSet {
  return {
    ...calibration,

    updatedAt:
      new Date().toISOString(),

    maps: cloneCalibrationMaps(
      maps,
    ),
  };
}

export function createSnapshot(
  name: string,
  maps: CalibrationSet["maps"],
): CalibrationSnapshot {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt:
      new Date().toISOString(),

    maps: cloneCalibrationMaps(
      maps,
    ),
  };
}

export function recordMapChange(
  map: EcuMap,
  row: number,
  column: number,
  oldValue: number,
  newValue: number,
): CalibrationChange {
  return {
    id: crypto.randomUUID(),

    timestamp:
      new Date().toISOString(),

    mapId: map.id,
    mapName: map.name,

    row,
    column,

    oldValue,
    newValue,
  };
}

export function exportCalibration(
  calibration: CalibrationSet,
): string {
  return JSON.stringify(
    calibration,
    null,
    2,
  );
}

export function importCalibration(
  json: string,
): CalibrationSet {
  const parsed =
    JSON.parse(json) as CalibrationSet;

  if (
    !parsed ||
    typeof parsed !== "object"
  ) {
    throw new Error(
      "Invalid calibration file.",
    );
  }

  if (
    typeof parsed.id !==
    "string"
  ) {
    throw new Error(
      "Calibration ID is missing.",
    );
  }

  if (
    typeof parsed.name !==
    "string"
  ) {
    throw new Error(
      "Calibration name is missing.",
    );
  }

  if (
    !parsed.maps ||
    !parsed.maps.fuel ||
    !parsed.maps.ignition ||
    !parsed.maps.boost
  ) {
    throw new Error(
      "Calibration maps are missing.",
    );
  }

  return {
    ...parsed,

    maps: cloneCalibrationMaps(
      parsed.maps,
    ),
  };
}

export function compareMaps(
  first: EcuMap,
  second: EcuMap,
): number {
  let differences = 0;

  const rows = Math.min(
    first.values.length,
    second.values.length,
  );

  for (
    let row = 0;
    row < rows;
    row++
  ) {
    const columns = Math.min(
      first.values[row].length,
      second.values[row].length,
    );

    for (
      let column = 0;
      column < columns;
      column++
    ) {
      if (
        first.values[row][column] !==
        second.values[row][column]
      ) {
        differences++;
      }
    }
  }

  return differences;
}