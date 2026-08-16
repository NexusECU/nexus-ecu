export interface BrakeBoostConfig {
  enabled: boolean;

  minimumRpm: number;

  minimumThrottlePercent: number;

  minimumBrakePercent: number;

  maximumVehicleSpeedKph: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  torqueMultiplier: number;

  maximumCoolantTemperatureC: number;

  maximumIntakeAirTemperatureC: number;
}

export interface BrakeBoostInput {
  engineRunning: boolean;

  rpm: number;

  throttlePosition: number;

  brakePosition: number;

  vehicleSpeedKph: number;

  coolantTemperatureC: number;

  intakeAirTemperatureC: number;

  releaseRequested: boolean;
}

export interface BrakeBoostResult {
  enabled: boolean;

  armed: boolean;

  active: boolean;

  released: boolean;

  thermalProtection: boolean;

  brakePosition: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  torqueMultiplier: number;

  reason: string;
}

export const defaultBrakeBoostConfig:
  BrakeBoostConfig = {
    enabled: false,

    minimumRpm: 2200,

    minimumThrottlePercent: 55,

    minimumBrakePercent: 40,

    maximumVehicleSpeedKph: 20,

    ignitionRetardDegrees: 9,

    fuelEnrichmentPercent: 10,

    boostHoldMultiplier: 1.14,

    torqueMultiplier: 0.55,

    maximumCoolantTemperatureC: 105,

    maximumIntakeAirTemperatureC: 70,
  };

export function calculateBrakeBoost(
  input: BrakeBoostInput,
  config: BrakeBoostConfig =
    defaultBrakeBoostConfig,
): BrakeBoostResult {
  if (!config.enabled) {
    return {
      enabled: false,
      armed: false,
      active: false,
      released: false,
      thermalProtection: false,
      brakePosition:
        input.brakePosition,
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
      thermalProtection: false,
      brakePosition:
        input.brakePosition,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason: "ENGINE OFF",
    };
  }

  const thermalProtection =
    input.coolantTemperatureC >=
      config.maximumCoolantTemperatureC ||
    input.intakeAirTemperatureC >=
      config.maximumIntakeAirTemperatureC;

  if (thermalProtection) {
    return {
      enabled: true,
      armed: false,
      active: false,
      released: false,
      thermalProtection: true,
      brakePosition:
        input.brakePosition,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason: "THERMAL PROTECTION",
    };
  }

  const armed =
    input.rpm >=
      config.minimumRpm &&
    input.throttlePosition >=
      config.minimumThrottlePercent &&
    input.brakePosition >=
      config.minimumBrakePercent &&
    input.vehicleSpeedKph <=
      config.maximumVehicleSpeedKph;

  if (
    input.releaseRequested &&
    armed
  ) {
    return {
      enabled: true,
      armed: true,
      active: false,
      released: true,
      thermalProtection: false,
      brakePosition:
        input.brakePosition,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason: "RELEASED",
    };
  }

  if (!armed) {
    let reason =
      "NOT ARMED";

    if (
      input.rpm <
      config.minimumRpm
    ) {
      reason =
        "RPM TOO LOW";
    } else if (
      input.throttlePosition <
      config.minimumThrottlePercent
    ) {
      reason =
        "THROTTLE TOO LOW";
    } else if (
      input.brakePosition <
      config.minimumBrakePercent
    ) {
      reason =
        "BRAKE TOO LOW";
    } else if (
      input.vehicleSpeedKph >
      config.maximumVehicleSpeedKph
    ) {
      reason =
        "VEHICLE SPEED TOO HIGH";
    }

    return {
      enabled: true,
      armed: false,
      active: false,
      released: false,
      thermalProtection: false,
      brakePosition:
        input.brakePosition,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason,
    };
  }

  const brakeFactor =
    Math.min(
      1,
      Math.max(
        0,
        (
          input.brakePosition -
          config.minimumBrakePercent
        ) /
          Math.max(
            1,
            100 -
              config.minimumBrakePercent,
          ),
      ),
    );

  const throttleFactor =
    Math.min(
      1,
      Math.max(
        0,
        (
          input.throttlePosition -
          config.minimumThrottlePercent
        ) /
          Math.max(
            1,
            100 -
              config.minimumThrottlePercent,
          ),
      ),
    );

  const intervention =
    Math.min(
      1,
      Math.max(
        0.35,
        brakeFactor *
          0.55 +
          throttleFactor *
            0.45,
      ),
    );

  return {
    enabled: true,
    armed: true,
    active: true,
    released: false,
    thermalProtection: false,
    brakePosition:
      input.brakePosition,
    ignitionRetardDegrees:
      config.ignitionRetardDegrees *
      intervention,
    fuelEnrichmentPercent:
      config.fuelEnrichmentPercent *
      intervention,
    boostHoldMultiplier:
      1 +
      (
        config.boostHoldMultiplier -
        1
      ) *
        intervention,
    torqueMultiplier:
      1 -
      (
        1 -
        config.torqueMultiplier
      ) *
        intervention,
    reason: "BOOST BUILD",
  };
}
