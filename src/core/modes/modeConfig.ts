import type { EcuMode } from "../../types/ecu";

export interface EcuModeConfig {
  id: EcuMode;
  name: string;
  description: string;

  throttleResponse: number;
  rpmResponse: number;
  boostMultiplier: number;
  fuelMultiplier: number;
  ignitionMultiplier: number;
  maxRpmMultiplier: number;
}

export const ecuModes: Record<
  EcuMode,
  EcuModeConfig
> = {
  street: {
    id: "street",
    name: "Street",
    description:
      "Balanced response for everyday driving.",
    throttleResponse: 0.85,
    rpmResponse: 0.85,
    boostMultiplier: 0.85,
    fuelMultiplier: 1,
    ignitionMultiplier: 1,
    maxRpmMultiplier: 0.95,
  },

  sport: {
    id: "sport",
    name: "Sport",
    description:
      "Sharper throttle and stronger performance response.",
    throttleResponse: 1.05,
    rpmResponse: 1.05,
    boostMultiplier: 1,
    fuelMultiplier: 1.02,
    ignitionMultiplier: 1.02,
    maxRpmMultiplier: 1,
  },

  race: {
    id: "race",
    name: "Race",
    description:
      "Track-focused performance calibration.",
    throttleResponse: 1.2,
    rpmResponse: 1.2,
    boostMultiplier: 1.15,
    fuelMultiplier: 1.08,
    ignitionMultiplier: 1.05,
    maxRpmMultiplier: 1.05,
  },

  drift: {
    id: "drift",
    name: "Drift",
    description:
      "Aggressive response for sustained RPM and rapid throttle changes.",
    throttleResponse: 1.15,
    rpmResponse: 1.15,
    boostMultiplier: 1.1,
    fuelMultiplier: 1.05,
    ignitionMultiplier: 1.02,
    maxRpmMultiplier: 1.05,
  },

  drag: {
    id: "drag",
    name: "Drag",
    description:
      "Launch and maximum acceleration focused calibration.",
    throttleResponse: 1.25,
    rpmResponse: 1.25,
    boostMultiplier: 1.2,
    fuelMultiplier: 1.1,
    ignitionMultiplier: 1.05,
    maxRpmMultiplier: 1.08,
  },

  circuit: {
    id: "circuit",
    name: "Circuit",
    description:
      "Balanced track calibration for repeated high-load operation.",
    throttleResponse: 1.12,
    rpmResponse: 1.1,
    boostMultiplier: 1.1,
    fuelMultiplier: 1.06,
    ignitionMultiplier: 1.04,
    maxRpmMultiplier: 1.04,
  },

  rally: {
    id: "rally",
    name: "Rally",
    description:
      "Fast response for changing loads and variable surfaces.",
    throttleResponse: 1.18,
    rpmResponse: 1.15,
    boostMultiplier: 1.12,
    fuelMultiplier: 1.07,
    ignitionMultiplier: 1.03,
    maxRpmMultiplier: 1.04,
  },

  "off-road": {
    id: "off-road",
    name: "Off-Road",
    description:
      "Low-speed torque and controlled throttle response.",
    throttleResponse: 0.95,
    rpmResponse: 0.9,
    boostMultiplier: 0.95,
    fuelMultiplier: 1.02,
    ignitionMultiplier: 1,
    maxRpmMultiplier: 0.9,
  },

  custom: {
    id: "custom",
    name: "Custom",
    description:
      "Fully configurable user calibration.",
    throttleResponse: 1,
    rpmResponse: 1,
    boostMultiplier: 1,
    fuelMultiplier: 1,
    ignitionMultiplier: 1,
    maxRpmMultiplier: 1,
  },

  test: {
    id: "test",
    name: "Test",
    description:
      "Development and ECU simulation mode.",
    throttleResponse: 1,
    rpmResponse: 1,
    boostMultiplier: 1,
    fuelMultiplier: 1,
    ignitionMultiplier: 1,
    maxRpmMultiplier: 1,
  },
};