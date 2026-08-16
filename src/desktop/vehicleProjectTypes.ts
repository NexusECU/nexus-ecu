import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

export type VehicleProjectProfile = {
  id: string;

  name: string;

  createdAt: string;

  updatedAt: string;

  vehicleLabel: string;

  vin: string | null;

  ecuLabel: string;

  calibrationId: string | null;

  notes: string;

  session:
    NexusProjectSessionState;
};

export type VehicleProjectIndex = {
  schemaVersion:
    1;

  activeProjectId:
    string | null;

  projects:
    VehicleProjectProfile[];
};
