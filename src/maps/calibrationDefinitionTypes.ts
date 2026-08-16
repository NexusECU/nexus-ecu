import type {
  EcuMap,
  MapKind,
} from "./mapTypes";

export type CalibrationItemType =
  | "table-3d"
  | "table-2d"
  | "curve-1d"
  | "scalar"
  | "boolean"
  | "limit"
  | "constant";

export type CalibrationEndian =
  | "little"
  | "big";

export type CalibrationScale = {
  multiplier: number;
  offset: number;
};

export type CalibrationBinaryLayout = {
  address: string;

  dataType: string;

  endian: CalibrationEndian;

  scale: CalibrationScale;

  rows?: number;

  columns?: number;

  rowStrideBytes?: number;

  columnStrideBytes?: number;

  xAxisAddress?: string | null;

  yAxisAddress?: string | null;

  xAxisDataType?: string | null;

  yAxisDataType?: string | null;

  xAxisScale?: CalibrationScale | null;

  yAxisScale?: CalibrationScale | null;
};

export type CalibrationDefinition = {
  id: string;
  name: string;
  category: string;
  type: CalibrationItemType;
  mapKind: MapKind | null;
  description: string;
  unit: string;
  address: string;
  dataType: string;
  readOnly: boolean;
  value?: number | boolean | string;
  map?: EcuMap;

  binary?: CalibrationBinaryLayout;
};
