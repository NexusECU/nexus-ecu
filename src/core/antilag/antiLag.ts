export interface AntiLagConfig {
  enabled: boolean;

  minimumRpm: number;

  minimumThrottlePercent: number;

  maximumThrottlePercent: number;

  minimumBoostKpa: number;

  maximumCoolantTemperatureC: number;

  maximumIntakeAirTemperatureC: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;
}

export interface AntiLagInput {
  engineRunning: boolean;

  rpm: number;

  throttlePosition: number;

  boostKpa: number;

  coolantTemperatureC: number;

  intakeAirTemperatureC: number;
}

export interface AntiLagResult {
  enabled: boolean;

  active: boolean;

  thermalProtection: boolean;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  reason: string;
}

export const defaultAntiLagConfig:
  AntiLagConfig = {
    enabled: false,

    minimumRpm: 2500,

    minimumThrottlePercent: 5,

    maximumThrottlePercent: 35,

    minimumBoostKpa: 10,

    maximumCoolantTemperatureC: 105,

    maximumIntakeAirTemperatureC: 70,

    ignitionRetardDegrees: 12,

    fuelEnrichmentPercent: 12,

    boostHoldMultiplier: 1.15,
  };

export function calculateAntiLag(
  input: AntiLagInput,
  config: AntiLagConfig =
    defaultAntiLagConfig,
): AntiLagResult {
  if (!config.enabled) {
    return {
      enabled: false,
      active: false,
      thermalProtection: false,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      reason: "DISABLED",
    };
  }

  if (!input.engineRunning) {
    return {
      enabled: true,
      active: false,
      thermalProtection: false,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
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
      active: false,
      thermalProtection: true,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      reason: "THERMAL PROTECTION",
    };
  }

  if (
    input.rpm <
    config.minimumRpm
  ) {
    return {
      enabled: true,
      active: false,
      thermalProtection: false,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      reason: "RPM TOO LOW",
    };
  }

  if (
    input.throttlePosition <
      config.minimumThrottlePercent ||
    input.throttlePosition >
      config.maximumThrottlePercent
  ) {
    return {
      enabled: true,
      active: false,
      thermalProtection: false,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      reason: "THROTTLE OUT OF RANGE",
    };
  }

  if (
    input.boostKpa <
    config.minimumBoostKpa
  ) {
    return {
      enabled: true,
      active: false,
      thermalProtection: false,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      reason: "BOOST TOO LOW",
    };
  }

  const rpmFactor =
    Math.min(
      1,
      Math.max(
        0,
        (input.rpm -
          config.minimumRpm) /
          3000,
      ),
    );

  const throttleWindow =
    Math.max(
      1,
      config.maximumThrottlePercent -
        config.minimumThrottlePercent,
    );

  const throttlePosition =
    (input.throttlePosition -
      config.minimumThrottlePercent) /
    throttleWindow;

  const intervention =
    Math.min(
      1,
      Math.max(
        0.35,
        0.65 * rpmFactor +
          0.35 *
            (1 -
              Math.min(
                1,
                Math.max(
                  0,
                  throttlePosition,
                ),
              )),
      ),
    );

  return {
    enabled: true,
    active: true,
    thermalProtection: false,
    ignitionRetardDegrees:
      config.ignitionRetardDegrees *
      intervention,
    fuelEnrichmentPercent:
      config.fuelEnrichmentPercent *
      intervention,
    boostHoldMultiplier:
      1 +
      (config.boostHoldMultiplier -
        1) *
        intervention,
    reason: "ACTIVE",
  };
}
