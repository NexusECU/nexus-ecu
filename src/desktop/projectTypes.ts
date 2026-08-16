import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

export const NEXUS_PROJECT_SCHEMA =
  2;

export type ProjectVehicleDetails = {
  vin: string;
  make: string;
  model: string;
  year: string;
  engine: string;
  ecu: string;
  transmission: string;
  fuel: string;
  modifications: string;
};

export type CalibrationRevision = {
  id: string;
  name: string;
  createdAt: string;
  notes: string;
  maps: CalibrationSet["maps"];
};

export type CalibrationEditRecord = {
  id: string;
  createdAt: string;
  mapId: string;
  mapName: string;
  changedCells: number;
};

export type NexusProject = {
  schemaVersion: number;
  appVersion: string;
  id: string;
  name: string;
  vehicleProfileId: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  tunerName: string;
  vehicle: ProjectVehicleDetails;
  favouriteMapIds: string[];
  revisions: CalibrationRevision[];
  editHistory: CalibrationEditRecord[];
  maps: CalibrationSet["maps"];
};

export type RecentProject = {
  name: string;
  path: string;
  openedAt: string;
};
