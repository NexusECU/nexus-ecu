export interface TransmissionConfig {
  enabled: boolean;

  gearCount: number;

  shiftUpRpmPercent: number;

  shiftDownRpmPercent: number;

  minimumShiftIntervalMs: number;

  gearRatios: Record<number, number>;
}

export interface TransmissionInput {
  engineRunning: boolean;

  rpm: number;

  redlineRpm: number;

  vehicleSpeedKph: number;

  throttlePosition: number;

  currentGear: number;

  elapsedSinceShiftMs: number;
}

export interface TransmissionResult {
  enabled: boolean;

  currentGear: number;

  shiftUpRequested: boolean;

  shiftDownRequested: boolean;

  shiftOccurred: boolean;

  previousGear: number;

  reason: string;
}

export const defaultTransmissionConfig:
  TransmissionConfig = {
    enabled: true,

    gearCount: 6,

    shiftUpRpmPercent: 0.88,

    shiftDownRpmPercent: 0.38,

    minimumShiftIntervalMs: 650,

    gearRatios: {
      1: 3.4,
      2: 2.2,
      3: 1.6,
      4: 1.25,
      5: 1,
      6: 0.82,
    },
  };

export function calculateTransmission(
  input: TransmissionInput,
  config: TransmissionConfig =
    defaultTransmissionConfig,
): TransmissionResult {
  const currentGear =
    Math.max(
      1,
      Math.min(
        config.gearCount,
        Math.round(
          input.currentGear,
        ),
      ),
    );

  if (
    !config.enabled ||
    !input.engineRunning
  ) {
    return {
      enabled:
        config.enabled,
      currentGear,
      shiftUpRequested: false,
      shiftDownRequested: false,
      shiftOccurred: false,
      previousGear:
        currentGear,
      reason:
        config.enabled
          ? "ENGINE OFF"
          : "DISABLED",
    };
  }

  if (
    input.elapsedSinceShiftMs <
    config.minimumShiftIntervalMs
  ) {
    return {
      enabled: true,
      currentGear,
      shiftUpRequested: false,
      shiftDownRequested: false,
      shiftOccurred: false,
      previousGear:
        currentGear,
      reason: "SHIFT LOCKOUT",
    };
  }

  const rpmPercent =
    input.redlineRpm <= 0
      ? 0
      : input.rpm /
        input.redlineRpm;

  const shiftUpRequested =
    rpmPercent >=
      config.shiftUpRpmPercent &&
    currentGear <
      config.gearCount &&
    input.throttlePosition >=
      35;

  if (shiftUpRequested) {
    return {
      enabled: true,
      currentGear:
        currentGear + 1,
      shiftUpRequested: true,
      shiftDownRequested: false,
      shiftOccurred: true,
      previousGear:
        currentGear,
      reason: "SHIFT UP",
    };
  }

  const shiftDownRequested =
    rpmPercent <=
      config.shiftDownRpmPercent &&
    currentGear > 1 &&
    input.vehicleSpeedKph >
      5;

  if (shiftDownRequested) {
    return {
      enabled: true,
      currentGear:
        currentGear - 1,
      shiftUpRequested: false,
      shiftDownRequested: true,
      shiftOccurred: true,
      previousGear:
        currentGear,
      reason: "SHIFT DOWN",
    };
  }

  return {
    enabled: true,
    currentGear,
    shiftUpRequested: false,
    shiftDownRequested: false,
    shiftOccurred: false,
    previousGear:
      currentGear,
    reason: "HOLD GEAR",
  };
}
