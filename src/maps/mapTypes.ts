export type MapKind =
  | "fuel"
  | "ignition"
  | "boost";

export interface MapAxis {
  values: number[];
  label: string;
  unit: string;
}

export interface EcuMap {
  id: string;
  name: string;
  kind: MapKind;

  xAxis: MapAxis;
  yAxis: MapAxis;

  /**
   * Values are stored as:
   * rows = Y axis
   * columns = X axis
   */
  values: number[][];

  unit: string;

  minimum: number;
  maximum: number;
}

export interface MapPoint {
  x: number;
  y: number;
  value: number;
}

export interface MapValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}