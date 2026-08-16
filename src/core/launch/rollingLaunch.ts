export interface RollingLaunchConfig {
  enabled: boolean;

  targetSpeedKph: number;

  speedWindowKph: number;

  minimumRpm: number;

  minimumThrottlePercent: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;
}

export interface RollingLaunchInput {
  engineRunning: boolean;

  vehicleSpeedKph: number;

  rpm: number;

  throttlePosition: number;

  boostKpa: number;

  releaseRequested: boolean;
}

export interface RollingLaunchResult {
  enabled: boolean;

  armed: boolean;

  active: boolean;

  released: boolean;

  targetSpeedKph: number;

  speedErrorKph: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  torqueMultiplier: number;

  reason: string;
}

export const defaultRollingLaunchConfig:
  RollingLaunchConfig = {
    enabled: false,

    targetSpeedKph: 60,

    speedWindowKph: 4,

    minimumRpm: 2500,

    minimumThrottlePercent: 55,

    ignitionRetardDegrees: 10,

    fuelEnrichmentPercent: 8,

    boostHoldMultiplier: 1.12,
  };

export function calculateRollingLaunch(
  input: RollingLaunchInput,
  config: RollingLaunchConfig =
    defaultRollingLaunchConfig,
): RollingLaunchResult {
  if (!config.enabled) {
    return {
      enabled: false,
      armed: false,
      active: false,
      released: false,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph: 0,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason: "DISABLED",
    };
  }

  if (!input.engineRunning) {
    return {
      enabled: true,
      armed: false,
      active: false,
      released: false,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph: 0,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason: "ENGINE OFF",
    };
  }

  const speedErrorKph =
    input.vehicleSpeedKph -
    config.targetSpeedKph;

  const speedInWindow =
    Math.abs(
      speedErrorKph,
    ) <=
    config.speedWindowKph;

  const armed =
    input.rpm >=
      config.minimumRpm &&
    input.throttlePosition >=
      config.minimumThrottlePercent &&
    speedInWindow;

  if (
    input.releaseRequested &&
    armed
  ) {
    return {
      enabled: true,
      armed: true,
      active: false,
      released: true,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason: "RELEASED",
    };
  }

  if (!armed) {
    return {
      enabled: true,
      armed: false,
      active: false,
      released: false,
      targetSpeedKph:
        config.targetSpeedKph,
      speedErrorKph,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason:
        !speedInWindow
          ? "TARGET SPEED NOT REACHED"
          : input.rpm <
              config.minimumRpm
            ? "RPM TOO LOW"
            : "THROTTLE TOO LOW",
    };
  }

  const speedCorrection =
    Math.min(
      1,
      Math.abs(
        speedErrorKph,
      ) /
        Math.max(
          1,
          config.speedWindowKph,
        ),
    );

  const torqueMultiplier =
    speedErrorKph > 0
      ? Math.max(
          0.45,
          0.75 -
            speedCorrection *
              0.25,
        )
      : 0.78;

  return {
    enabled: true,
    armed: true,
    active: true,
    released: false,
    targetSpeedKph:
      config.targetSpeedKph,
    speedErrorKph,
    ignitionRetardDegrees:
      config.ignitionRetardDegrees,
    fuelEnrichmentPercent:
      config.fuelEnrichmentPercent,
    boostHoldMultiplier:
      config.boostHoldMultiplier,
    torqueMultiplier,
    reason: "BOOST BUILD",
  };
}
