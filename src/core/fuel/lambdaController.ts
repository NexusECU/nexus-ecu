export interface LambdaControllerConfig {
  enabled: boolean;

  proportionalGain: number;

  maximumPositiveTrim: number;

  maximumNegativeTrim: number;

  minimumRpm: number;

  minimumCoolantTemperatureC: number;

  minimumThrottlePercent: number;

  maximumThrottlePercent: number;
}

export interface LambdaControllerInput {
  targetAfr: number;

  measuredAfr: number;

  rpm: number;

  coolantTemperatureC: number;

  throttlePosition: number;

  engineRunning: boolean;
}

export interface LambdaControllerResult {
  active: boolean;

  errorAfr: number;

  fuelTrimPercent: number;

  multiplier: number;
}

export const defaultLambdaControllerConfig:
  LambdaControllerConfig = {
    enabled: true,

    proportionalGain: 8,

    maximumPositiveTrim: 15,

    maximumNegativeTrim: -15,

    minimumRpm: 900,

    minimumCoolantTemperatureC: 60,

    minimumThrottlePercent: 2,

    maximumThrottlePercent: 80,
  };

export function calculateLambdaCorrection(
  input: LambdaControllerInput,
  config: LambdaControllerConfig =
    defaultLambdaControllerConfig,
): LambdaControllerResult {
  const allowed =
    config.enabled &&
    input.engineRunning &&
    input.rpm >= config.minimumRpm &&
    input.coolantTemperatureC >=
      config.minimumCoolantTemperatureC &&
    input.throttlePosition >=
      config.minimumThrottlePercent &&
    input.throttlePosition <=
      config.maximumThrottlePercent;

  if (!allowed) {
    return {
      active: false,
      errorAfr: 0,
      fuelTrimPercent: 0,
      multiplier: 1,
    };
  }

  /*
   * Positive AFR error means measured AFR
   * is leaner than target, so add fuel.
   *
   * Example:
   * target 14.0
   * measured 14.7
   * error = +0.7
   */
  const errorAfr =
    input.measuredAfr -
    input.targetAfr;

  const rawTrim =
    errorAfr *
    config.proportionalGain;

  const fuelTrimPercent =
    Math.max(
      config.maximumNegativeTrim,
      Math.min(
        config.maximumPositiveTrim,
        rawTrim,
      ),
    );

  const multiplier =
    1 +
    fuelTrimPercent / 100;

  return {
    active: true,
    errorAfr,
    fuelTrimPercent,
    multiplier,
  };
}