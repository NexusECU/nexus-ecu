export interface PitLimiterConfig {
  enabled: boolean;

  targetSpeedKph: number;

  warningMarginKph: number;

  hardCutMarginKph: number;

  maximumIgnitionRetardDegrees: number;

  minimumBoostMultiplier: number;
}

export interface PitLimiterInput {
  engineRunning: boolean;

  vehicleSpeedKph: number;

  throttlePosition: number;

  rpm: number;
}

export interface PitLimiterResult {
  enabled: boolean;

  active: boolean;

  hardCutActive: boolean;

  targetSpeedKph: number;

  speedErrorKph: number;

  ignitionRetardDegrees: number;

  boostMultiplier: number;

  fuelCut: boolean;

  reason: string;
}

export const defaultPitLimiterConfig:
  PitLimiterConfig = {
    enabled: false,

    targetSpeedKph: 60,

    warningMarginKph: 3,

    hardCutMarginKph: 7,

    maximumIgnitionRetardDegrees: 12,

    minimumBoostMultiplier: 0.2,
  };

export function calculatePitLimiter(
  input: PitLimiterInput,
  config: PitLimiterConfig =
    defaultPitLimiterConfig,
): PitLimiterResult {
  if (!config.enabled) {
    return {
      enabled: false,
      active: false,
      hardCutActive: false,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph: 0,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
      reason: "DISABLED",
    };
  }

  if (!input.engineRunning) {
    return {
      enabled: true,
      active: false,
      hardCutActive: false,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph: 0,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
      reason: "ENGINE OFF",
    };
  }

  const speedErrorKph =
    input.vehicleSpeedKph -
    config.targetSpeedKph;

  const active =
    speedErrorKph >=
    -config.warningMarginKph;

  if (!active) {
    return {
      enabled: true,
      active: false,
      hardCutActive: false,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
      reason: "ARMED",
    };
  }

  const hardCutActive =
    speedErrorKph >=
    config.hardCutMarginKph;

  if (hardCutActive) {
    return {
      enabled: true,
      active: true,
      hardCutActive: true,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph,
      ignitionRetardDegrees:
        config.maximumIgnitionRetardDegrees,
      boostMultiplier:
        config.minimumBoostMultiplier,
      fuelCut: true,
      reason: "HARD SPEED CUT",
    };
  }

  const interventionRange =
    Math.max(
      1,
      config.warningMarginKph +
        config.hardCutMarginKph,
    );

  const intervention =
    Math.min(
      1,
      Math.max(
        0,
        (speedErrorKph +
          config.warningMarginKph) /
          interventionRange,
      ),
    );

  const ignitionRetardDegrees =
    config.maximumIgnitionRetardDegrees *
    intervention;

  const boostMultiplier =
    Math.max(
      config.minimumBoostMultiplier,
      1 -
        intervention *
          (1 -
            config.minimumBoostMultiplier),
    );

  return {
    enabled: true,
    active: true,
    hardCutActive: false,
    targetSpeedKph:
      config.targetSpeedKph,
    speedErrorKph,
    ignitionRetardDegrees,
    boostMultiplier,
    fuelCut: false,
    reason: "LIMITING",
  };
}
