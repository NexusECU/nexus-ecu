export interface TorqueManagementInput {
  engineRunning: boolean;

  throttlePosition: number;

  engineLoad: number;

  tractionActive: boolean;

  tractionSevere: boolean;

  transmissionShiftActive: boolean;

  launchControlActive: boolean;

  pitLimiterActive: boolean;

  pitLimiterHardCut: boolean;

  boostByGearMultiplier: number;

  antiLagActive: boolean;

  noLiftShiftActive: boolean;

  noLiftShiftRecovering: boolean;

  engineProtectionLevel:
    | "normal"
    | "warning"
    | "limp"
    | "shutdown";

  driveModeTorqueMultiplier: number;

  driveModeThrottleAuthority: number;

  driveModeBoostAllowance: number;

  driveModeTractionBias: number;

  rollingLaunchActive: boolean;

  rollingLaunchTorqueMultiplier: number;

  brakeBoostActive: boolean;

  brakeBoostTorqueMultiplier: number;

  sensorFaultActive: boolean;

  sensorFaultLimpMode: boolean;

  sensorFaultTorqueMultiplier: number;
}

export interface TorqueManagementResult {
  active: boolean;

  requestedTorquePercent: number;

  deliveredTorquePercent: number;

  throttleMultiplier: number;

  ignitionRetardDegrees: number;

  boostMultiplier: number;

  fuelCut: boolean;

  dominantReason: string;
}

export function calculateTorqueManagement(
  input: TorqueManagementInput,
): TorqueManagementResult {
  if (!input.engineRunning) {
    return {
      active: false,
      requestedTorquePercent: 0,
      deliveredTorquePercent: 0,
      throttleMultiplier: 1,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
      dominantReason: "ENGINE OFF",
    };
  }

  const requestedTorquePercent =
    Math.min(
      100,
      Math.max(
        0,
        (
          input.throttlePosition *
            0.65 +
          input.engineLoad *
            100 *
            0.35
        ) *
          input.driveModeTorqueMultiplier,
      ),
    );

  let throttleMultiplier =
    Math.max(
      0,
      Math.min(
        1.2,
        input.driveModeThrottleAuthority,
      ),
    );

  let ignitionRetardDegrees = 0;

  let boostMultiplier =
    Math.max(
      0,
      Math.min(
        1.25,
        input.boostByGearMultiplier *
          input.driveModeBoostAllowance,
      ),
    );
  let fuelCut = false;
  let dominantReason = "DRIVER REQUEST";

  if (
    input.engineProtectionLevel ===
    "shutdown"
  ) {
    throttleMultiplier = 0;
    ignitionRetardDegrees = 20;
    boostMultiplier = 0;
    fuelCut = true;
    dominantReason =
      "ENGINE PROTECTION SHUTDOWN";
  } else if (
    input.engineProtectionLevel ===
    "limp"
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.45,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        8,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.35,
      );

    dominantReason =
      "ENGINE PROTECTION LIMP";
  } else if (
    input.engineProtectionLevel ===
    "warning"
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.8,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        3,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.8,
      );

    dominantReason =
      "ENGINE PROTECTION WARNING";
  }

  if (
    input.pitLimiterHardCut
  ) {
    throttleMultiplier = 0.2;
    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        12,
      );
    boostMultiplier = 0;
    fuelCut = true;
    dominantReason =
      "PIT LIMITER HARD CUT";
  } else if (
    input.pitLimiterActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.55,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        6,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.5,
      );

    dominantReason =
      "PIT LIMITER";
  }

  const tractionSeverityMultiplier =
    Math.max(
      0.5,
      Math.min(
        1.5,
        input.driveModeTractionBias,
      ),
    );

  if (
    input.tractionSevere
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.35,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        10 *
          tractionSeverityMultiplier,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.25 /
          tractionSeverityMultiplier,
      );

    dominantReason =
      "TRACTION CONTROL SEVERE";
  } else if (
    input.tractionActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.7,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        5 *
          tractionSeverityMultiplier,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.65 /
          tractionSeverityMultiplier,
      );

    dominantReason =
      "TRACTION CONTROL";
  }

  if (
    input.transmissionShiftActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.6,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        7,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.75,
      );

    dominantReason =
      "SHIFT TORQUE REDUCTION";
  }

  if (
    input.noLiftShiftActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.5,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        12,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.9,
      );

    dominantReason =
      "NO-LIFT SHIFT";
  } else if (
    input.noLiftShiftRecovering
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.8,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        4,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.95,
      );

    dominantReason =
      "SHIFT RECOVERY";
  }

  if (
    input.sensorFaultActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        input.sensorFaultTorqueMultiplier,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        input.sensorFaultLimpMode
          ? 0.35
          : 0.75,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        input.sensorFaultLimpMode
          ? 6
          : 2,
      );

    dominantReason =
      input.sensorFaultLimpMode
        ? "SENSOR FAULT LIMP MODE"
        : "SENSOR FAULT FALLBACK";
  }

  if (
    input.brakeBoostActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        input.brakeBoostTorqueMultiplier,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        7,
      );

    boostMultiplier =
      Math.max(
        0.75,
        Math.min(
          boostMultiplier,
          0.95,
        ),
      );

    dominantReason =
      "BRAKE BOOST";
  }

  if (
    input.rollingLaunchActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        input.rollingLaunchTorqueMultiplier,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        8,
      );

    boostMultiplier =
      Math.max(
        0.75,
        Math.min(
          boostMultiplier,
          0.95,
        ),
      );

    dominantReason =
      "ROLLING LAUNCH";
  }

  if (
    input.launchControlActive
  ) {
    throttleMultiplier =
      Math.min(
        throttleMultiplier,
        0.65,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        8,
      );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.8,
      );

    dominantReason =
      "LAUNCH CONTROL";
  }

  if (
    input.antiLagActive &&
    !fuelCut
  ) {
    boostMultiplier =
      Math.max(
        boostMultiplier,
        0.9,
      );
  }

  const deliveredTorquePercent =
    requestedTorquePercent *
    throttleMultiplier;

  return {
    active:
      throttleMultiplier <
        0.999 ||
      ignitionRetardDegrees >
        0 ||
      boostMultiplier <
        0.999 ||
      fuelCut,

    requestedTorquePercent,

    deliveredTorquePercent:
      Math.max(
        0,
        Math.min(
          100,
          deliveredTorquePercent,
        ),
      ),

    throttleMultiplier,

    ignitionRetardDegrees,

    boostMultiplier,

    fuelCut,

    dominantReason,
  };
}
