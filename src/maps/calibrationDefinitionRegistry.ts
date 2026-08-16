import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

import type {
  CalibrationDefinition,
} from "./calibrationDefinitionTypes";

export function buildCalibrationDefinitions(
  maps: CalibrationSet["maps"],
): CalibrationDefinition[] {
  return [
    {
      id: "fuel-main",
      name: "Primary Fuel Target",
      category: "Fueling",
      type: "table-3d",
      mapKind: "fuel",
      description:
        "Primary commanded fuel target table indexed by engine speed and load.",
      unit: "AFR",
      address: "0x001000",
      dataType: "float32",
      readOnly: false,
      map: maps.fuel,
      binary: {
        address: "0x001000",
        dataType: "uint16",
        endian: "little",
        scale: {
          multiplier: 0.001,
          offset: 0,
        },
        xAxisAddress: "0x000F00",
        yAxisAddress: "0x000F40",
        xAxisDataType: "uint16",
        yAxisDataType: "uint16",
        xAxisScale: {
          multiplier: 0.01,
          offset: 0,
        },
        yAxisScale: {
          multiplier: 1,
          offset: 0,
        },
      },
    },
    {
      id: "ignition-main",
      name: "Primary Ignition Timing",
      category: "Ignition",
      type: "table-3d",
      mapKind: "ignition",
      description:
        "Primary spark advance table indexed by engine speed and load.",
      unit: "deg",
      address: "0x002000",
      dataType: "float32",
      readOnly: false,
      map: maps.ignition,
      binary: {
        address: "0x002000",
        dataType: "int16",
        endian: "little",
        scale: {
          multiplier: 0.1,
          offset: 0,
        },
        xAxisAddress: "0x001F00",
        yAxisAddress: "0x001F40",
        xAxisDataType: "uint16",
        yAxisDataType: "uint16",
        xAxisScale: {
          multiplier: 0.01,
          offset: 0,
        },
        yAxisScale: {
          multiplier: 1,
          offset: 0,
        },
      },
    },
    {
      id: "boost-main",
      name: "Boost Target",
      category: "Boost",
      type: "table-3d",
      mapKind: "boost",
      description:
        "Requested boost target table indexed by engine speed and load.",
      unit: "bar",
      address: "0x003000",
      dataType: "float32",
      readOnly: false,
      map: maps.boost,
      binary: {
        address: "0x003000",
        dataType: "uint16",
        endian: "little",
        scale: {
          multiplier: 0.001,
          offset: 0,
        },
        xAxisAddress: "0x002F00",
        yAxisAddress: "0x002F40",
        xAxisDataType: "uint16",
        yAxisDataType: "uint16",
        xAxisScale: {
          multiplier: 0.01,
          offset: 0,
        },
        yAxisScale: {
          multiplier: 1,
          offset: 0,
        },
      },
    },
    {
      id: "rev-limit",
      name: "Engine Speed Limiter",
      category: "Limits",
      type: "limit",
      mapKind: null,
      description:
        "Maximum engine-speed limiter calibration value.",
      unit: "rpm",
      address: "0x004010",
      dataType: "uint16",
      readOnly: false,
      value: 7500,
    },
    {
      id: "speed-limit",
      name: "Vehicle Speed Limiter",
      category: "Limits",
      type: "limit",
      mapKind: null,
      description:
        "Maximum vehicle-speed limiter calibration value.",
      unit: "km/h",
      address: "0x004012",
      dataType: "uint16",
      readOnly: false,
      value: 250,
    },
    {
      id: "idle-target",
      name: "Base Idle Target",
      category: "Scalars",
      type: "scalar",
      mapKind: null,
      description:
        "Base idle-speed target.",
      unit: "rpm",
      address: "0x004020",
      dataType: "uint16",
      readOnly: false,
      value: 850,
    },
    {
      id: "injector-flow",
      name: "Injector Nominal Flow",
      category: "Scalars",
      type: "constant",
      mapKind: null,
      description:
        "Nominal injector-flow constant used by the calibration model.",
      unit: "cc/min",
      address: "0x004040",
      dataType: "float32",
      readOnly: false,
      value: 1000,
    },
    {
      id: "closed-loop-fuel",
      name: "Closed Loop Fuel Enable",
      category: "Switches",
      type: "boolean",
      mapKind: null,
      description:
        "Enable or disable closed-loop fuel control in the calibration definition.",
      unit: "",
      address: "0x004030",
      dataType: "boolean",
      readOnly: false,
      value: true,
    },
    {
      id: "knock-control",
      name: "Knock Control Enable",
      category: "Switches",
      type: "boolean",
      mapKind: null,
      description:
        "Enable or disable knock-response logic in the calibration definition.",
      unit: "",
      address: "0x004031",
      dataType: "boolean",
      readOnly: false,
      value: true,
    },
  ];
}
