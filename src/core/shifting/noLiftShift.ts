export interface NoLiftShiftConfig {
  enabled: boolean;

  minimumRpm: number;

  minimumThrottlePercent: number;

  shiftWindowMs: number;

  recoveryWindowMs: number;

  ignitionCutDegrees: number;

  fuelCutEnabled: boolean;

  boostHoldMultiplier: number;
}

export interface NoLiftShiftInput {
  engineRunning: boolean;

  rpm: number;

  throttlePosition: number;

  vehicleSpeedKph: number;

  shiftRequested: boolean;

  elapsedMs: number;
}

export interface NoLiftShiftResult {
  enabled: boolean;

  armed: boolean;

  active: boolean;

  recovering: boolean;

  timerMs: number;

  ignitionRetardDegrees: number;

  fuelCut: boolean;

  boostHoldMultiplier: number;

  reason: string;
}

export const defaultNoLiftShiftConfig:
  NoLiftShiftConfig = {
    enabled: false,

    minimumRpm: 3000,

    minimumThrottlePercent: 70,

    shiftWindowMs: 180,

    recoveryWindowMs: 220,

    ignitionCutDegrees: 20,

    fuelCutEnabled: true,

    boostHoldMultiplier: 1.12,
  };

export function calculateNoLiftShift(
  input: NoLiftShiftInput,
  config: NoLiftShiftConfig =
    defaultNoLiftShiftConfig,
): NoLiftShiftResult {
  if (!config.enabled) {
    return {
      enabled: false,
      armed: false,
      active: false,
      recovering: false,
      timerMs: 0,
      ignitionRetardDegrees: 0,
      fuelCut: false,
      boostHoldMultiplier: 1,
      reason: "DISABLED",
    };
  }

  if (!input.engineRunning) {
    return {
      enabled: true,
      armed: false,
      active: false,
      recovering: false,
      timerMs: 0,
      ignitionRetardDegrees: 0,
      fuelCut: false,
      boostHoldMultiplier: 1,
      reason: "ENGINE OFF",
    };
  }

  const armed =
    input.rpm >=
      config.minimumRpm &&
    input.throttlePosition >=
      config.minimumThrottlePercent &&
    input.vehicleSpeedKph > 5;

  if (!armed) {
    return {
      enabled: true,
      armed: false,
      active: false,
      recovering: false,
      timerMs: 0,
      ignitionRetardDegrees: 0,
      fuelCut: false,
      boostHoldMultiplier: 1,
      reason: "NOT ARMED",
    };
  }

  const active =
    input.shiftRequested &&
    input.elapsedMs <=
      config.shiftWindowMs;

  if (active) {
    return {
      enabled: true,
      armed: true,
      active: true,
      recovering: false,
      timerMs:
        input.elapsedMs,
      ignitionRetardDegrees:
        config.ignitionCutDegrees,
      fuelCut:
        config.fuelCutEnabled,
      boostHoldMultiplier:
        config.boostHoldMultiplier,
      reason: "SHIFT CUT",
    };
  }

  const recovering =
    input.shiftRequested &&
    input.elapsedMs >
      config.shiftWindowMs &&
    input.elapsedMs <=
      config.shiftWindowMs +
        config.recoveryWindowMs;

  if (recovering) {
    const recoveryElapsed =
      input.elapsedMs -
      config.shiftWindowMs;

    const recoveryProgress =
      Math.min(
        1,
        Math.max(
          0,
          recoveryElapsed /
            config.recoveryWindowMs,
        ),
      );

    return {
      enabled: true,
      armed: true,
      active: false,
      recovering: true,
      timerMs:
        input.elapsedMs,
      ignitionRetardDegrees:
        config.ignitionCutDegrees *
        (1 -
          recoveryProgress),
      fuelCut: false,
      boostHoldMultiplier:
        1 +
        (config.boostHoldMultiplier -
          1) *
          (1 -
            recoveryProgress),
      reason: "RECOVERY",
    };
  }

  return {
    enabled: true,
    armed: true,
    active: false,
    recovering: false,
    timerMs: 0,
    ignitionRetardDegrees: 0,
    fuelCut: false,
    boostHoldMultiplier: 1,
    reason: "ARMED",
  };
}
