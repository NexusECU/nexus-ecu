export type VehicleConnectionStageId =
  | "adapter"
  | "interface"
  | "network"
  | "ecu"
  | "session"
  | "ready";

export type VehicleConnectionStageState =
  | "complete"
  | "active"
  | "blocked"
  | "pending";

export type VehicleConnectionStage = {
  id: VehicleConnectionStageId;
  label: string;
  state: VehicleConnectionStageState;
  detail: string;
};

export type VehicleConnectionFlow = {
  stages: VehicleConnectionStage[];
  currentStage: VehicleConnectionStageId;
  ready: boolean;
  blockedReason: string | null;
  progress: number;
};
