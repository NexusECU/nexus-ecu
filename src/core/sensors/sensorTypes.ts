export type SensorType =
  | "tps"
  | "map"
  | "maf"
  | "iat"
  | "ect"
  | "lambda"
  | "oil-pressure"
  | "fuel-pressure"
  | "battery"
  | "vehicle-speed"
  | "rpm"
  | "knock"
  | "fuel-level";

export type SensorStatus =
  | "ok"
  | "warning"
  | "fault"
  | "disconnected";

export interface SensorDefinition {
  id: SensorType;
  name: string;
  unit: string;

  minimum: number;
  maximum: number;

  defaultValue: number;

  critical: boolean;
}

export interface SensorReading {
  id: SensorType;

  value: number;

  unit: string;

  status: SensorStatus;

  timestamp: number;
}

export interface SensorLimits {
  warningLow?: number;
  warningHigh?: number;

  faultLow?: number;
  faultHigh?: number;
}