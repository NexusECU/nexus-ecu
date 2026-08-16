export interface RevLimiterConfig {
  enabled: boolean;

  softLimitOffsetRpm: number;

  hardLimitOffsetRpm: number;

  softIgnitionRetardDegrees: number;

  hardFuelCut: boolean;

  launchControlEnabled: boolean;

  launchRpm: number;

  launchThrottleMinimum: number;

  launchSpeedMaximumKph: number;
}

export interface RevLimiterInput {
  engineRunning: boolean;

  rpm: number;

  redlineRpm: number;

  throttlePosition: number;

  vehicleSpeedKph: number;
}

export interface RevLimiterResult {
  active: boolean;

  softLimitActive: boolean;

  hardLimitActive: boolean;

  launchControlActive: boolean;

  fuelCut: boolean;

  ignitionRetardDegrees: number;

  rpmLimit: number;
}

export const defaultRevLimiterConfig:
  RevLimiterConfig = {
    enabled: true,

    softLimitOffsetRpm: 250,

    hardLimitOffsetRpm: 0,

    softIgnitionRetardDegrees: 10,

    hardFuelCut: true,

    launchControlEnabled: true,

    launchRpm: 4000,

    launchThrottleMinimum: 70,

    launchSpeedMaximumKph: 5,
  };

export function calculateRevLimiter(
  input: RevLimiterInput,
  config: RevLimiterConfig =
    defaultRevLimiterConfig,
): RevLimiterResult {
  if (
    !config.enabled ||
    !input.engineRunning
  ) {
    return {
      active: false,
      softLimitActive: false,
      hardLimitActive: false,
      launchControlActive: false,
      fuelCut: false,
      ignitionRetardDegrees: 0,
      rpmLimit: input.redlineRpm,
    };
  }

  const launchControlActive =
    config.launchControlEnabled &&
    input.throttlePosition >=
      config.launchThrottleMinimum &&
    input.vehicleSpeedKph <=
      config.launchSpeedMaximumKph;

  const rpmLimit =
    launchControlActive
      ? config.launchRpm
      : input.redlineRpm;

  const softLimitRpm =
    rpmLimit -
    config.softLimitOffsetRpm;

  const hardLimitRpm =
    rpmLimit -
    config.hardLimitOffsetRpm;

  const softLimitActive =
    input.rpm >= softLimitRpm;

  const hardLimitActive =
    input.rpm >= hardLimitRpm;

  return {
    active:
      softLimitActive ||
      hardLimitActive ||
      launchControlActive,

    softLimitActive,

    hardLimitActive,

    launchControlActive,

    fuelCut:
      hardLimitActive &&
      config.hardFuelCut,

    ignitionRetardDegrees:
      softLimitActive
        ? config.softIgnitionRetardDegrees
        : 0,

    rpmLimit,
  };
}