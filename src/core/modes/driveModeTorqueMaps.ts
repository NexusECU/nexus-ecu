import type {
  EcuMode,
} from "../../types/ecu";

export interface DriveModeTorqueMap {
  id: EcuMode;

  name: string;

  torqueMultiplier: number;

  throttleAuthority: number;

  boostAllowance: number;

  ignitionBiasDegrees: number;

  launchBias: number;

  tractionBias: number;

  description: string;
}

export const driveModeTorqueMaps:
  Record<
    EcuMode,
    DriveModeTorqueMap
  > = {
    street: {
      id: "street",
      name: "Street",
      torqueMultiplier: 0.82,
      throttleAuthority: 0.86,
      boostAllowance: 0.82,
      ignitionBiasDegrees: 0,
      launchBias: 0.85,
      tractionBias: 1,
      description:
        "Progressive torque delivery with conservative boost and smooth response.",
    },

    sport: {
      id: "sport",
      name: "Sport",
      torqueMultiplier: 0.92,
      throttleAuthority: 0.94,
      boostAllowance: 0.92,
      ignitionBiasDegrees: 0.5,
      launchBias: 0.95,
      tractionBias: 0.92,
      description:
        "Sharper torque response with increased boost authority and reduced intervention.",
    },

    race: {
      id: "race",
      name: "Race",
      torqueMultiplier: 1,
      throttleAuthority: 1,
      boostAllowance: 1,
      ignitionBiasDegrees: 1,
      launchBias: 1,
      tractionBias: 0.82,
      description:
        "Maximum calibrated torque delivery with full boost authority.",
    },

    drift: {
      id: "drift",
      name: "Drift",
      torqueMultiplier: 0.96,
      throttleAuthority: 1,
      boostAllowance: 0.94,
      ignitionBiasDegrees: 0.8,
      launchBias: 0.9,
      tractionBias: 0.45,
      description:
        "Fast torque response with reduced traction intervention for sustained wheel speed.",
    },

    drag: {
      id: "drag",
      name: "Drag",
      torqueMultiplier: 1,
      throttleAuthority: 1,
      boostAllowance: 1.05,
      ignitionBiasDegrees: 1,
      launchBias: 1.08,
      tractionBias: 0.78,
      description:
        "Maximum straight-line torque with aggressive launch and boost strategy.",
    },

    circuit: {
      id: "circuit",
      name: "Circuit",
      torqueMultiplier: 0.97,
      throttleAuthority: 0.98,
      boostAllowance: 0.96,
      ignitionBiasDegrees: 0.7,
      launchBias: 0.95,
      tractionBias: 0.88,
      description:
        "Balanced sustained-performance torque delivery for repeated high-load operation.",
    },

    rally: {
      id: "rally",
      name: "Rally",
      torqueMultiplier: 0.94,
      throttleAuthority: 0.97,
      boostAllowance: 0.9,
      ignitionBiasDegrees: 0.5,
      launchBias: 1,
      tractionBias: 0.72,
      description:
        "Responsive torque delivery with moderated boost for changing surfaces.",
    },

    "off-road": {
      id: "off-road",
      name: "Off-Road",
      torqueMultiplier: 0.8,
      throttleAuthority: 0.75,
      boostAllowance: 0.72,
      ignitionBiasDegrees: -0.5,
      launchBias: 0.75,
      tractionBias: 1.08,
      description:
        "Controlled low-speed torque delivery with stronger traction intervention.",
    },

    custom: {
      id: "custom",
      name: "Custom",
      torqueMultiplier: 1,
      throttleAuthority: 1,
      boostAllowance: 1,
      ignitionBiasDegrees: 0,
      launchBias: 1,
      tractionBias: 1,
      description:
        "Neutral baseline for fully user-configurable torque strategy.",
    },

    test: {
      id: "test",
      name: "Test",
      torqueMultiplier: 0.7,
      throttleAuthority: 0.7,
      boostAllowance: 0.6,
      ignitionBiasDegrees: -1,
      launchBias: 0.6,
      tractionBias: 1.15,
      description:
        "Reduced-output development mode for safe ECU simulation and diagnostics.",
    },
  };
