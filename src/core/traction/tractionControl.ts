export interface TractionControlConfig {
  enabled: boolean;

  minimumSpeedKph: number;

  minimumThrottlePercent: number;

  activationSlipPercent: number;

  severeSlipPercent: number;

  maximumIgnitionRetardDegrees: number;

  minimumBoostMultiplier: number;

  fuelCutSlipPercent: number;
}

export interface TractionControlInput {
  engineRunning: boolean;

  rpm: number;

  throttlePosition: number;

  engineLoad: number;

  boostKpa: number;

  vehicleSpeedKph: number;
}

export interface TractionControlResult {
  active: boolean;

  severe: boolean;

  slipPercent: number;

  ignitionRetardDegrees: number;

  boostMultiplier: number;

  fuelCut: boolean;
}

export const defaultTractionControlConfig:
  TractionControlConfig = {
    enabled: true,

    minimumSpeedKph: 5,

    minimumThrottlePercent: 20,

    activationSlipPercent: 8,

    severeSlipPercent: 18,

    maximumIgnitionRetardDegrees: 8,

    minimumBoostMultiplier: 0.3,

    fuelCutSlipPercent: 26,
  };

export function calculateTractionControl(
  input: TractionControlInput,
  config: TractionControlConfig =
    defaultTractionControlConfig,
): TractionControlResult {
  if (
    !config.enabled ||
    !input.engineRunning ||
    input.vehicleSpeedKph <
      config.minimumSpeedKph ||
    input.throttlePosition <
      config.minimumThrottlePercent
  ) {
    return {
      active: false,
      severe: false,
      slipPercent: 0,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
    };
  }

  const throttleFactor =
    Math.min(
      1,
      Math.max(
        0,
        input.throttlePosition /
          100,
      ),
    );

  const loadFactor =
    Math.min(
      1,
      Math.max(
        0,
        input.engineLoad,
      ),
    );

  const boostFactor =
    Math.min(
      1,
      Math.max(
        0,
        input.boostKpa / 200,
      ),
    );

  const lowSpeedFactor =
    1 -
    Math.min(
      1,
      input.vehicleSpeedKph /
        120,
    );

  /*
   * Deterministic simulated wheel slip.
   *
   * Higher throttle, load and boost
   * increase slip while vehicle speed
   * reduces it.
   */
  const powerFactor =
    throttleFactor * 0.45 +
    loadFactor * 0.3 +
    boostFactor * 0.25;

  const surfaceVariation =
    Math.sin(
      input.rpm / 310,
    ) * 2;

  const slipPercent =
    Math.max(
      0,
      powerFactor *
        lowSpeedFactor *
        38 +
        surfaceVariation,
    );

  const active =
    slipPercent >=
    config.activationSlipPercent;

  if (!active) {
    return {
      active: false,
      severe: false,
      slipPercent,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
    };
  }

  const severe =
    slipPercent >=
    config.severeSlipPercent;

  const interventionRange =
    Math.max(
      1,
      config.fuelCutSlipPercent -
        config.activationSlipPercent,
    );

  const intervention =
    Math.min(
      1,
      Math.max(
        0,
        (slipPercent -
          config.activationSlipPercent) /
          interventionRange,
      ),
    );

  const ignitionRetardDegrees =
    intervention *
    config.maximumIgnitionRetardDegrees;

  const boostMultiplier =
    Math.max(
      config.minimumBoostMultiplier,
      1 -
        intervention *
          (1 -
            config.minimumBoostMultiplier),
    );

  const fuelCut =
    slipPercent >=
    config.fuelCutSlipPercent;

  return {
    active,
    severe,
    slipPercent,
    ignitionRetardDegrees,
    boostMultiplier,
    fuelCut,
  };
}
