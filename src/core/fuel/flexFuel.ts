export interface FlexFuelConfig {
  maximumEthanolPercent: number;

  maximumFuelMultiplier: number;

  maximumIgnitionAdvanceDegrees: number;

  maximumBoostMultiplier: number;
}

export interface FlexFuelResult {
  active: boolean;

  ethanolPercent: number;

  ethanolFraction: number;

  fuelMultiplier: number;

  ignitionAdvanceDegrees: number;

  boostMultiplier: number;

  estimatedStoichAfr: number;
}

export const defaultFlexFuelConfig:
  FlexFuelConfig = {
    maximumEthanolPercent: 85,

    /*
     * E85 requires substantially more
     * fuel volume than petrol. This is
     * deliberately simplified for the
     * simulator.
     */
    maximumFuelMultiplier: 1.3,

    maximumIgnitionAdvanceDegrees: 3,

    maximumBoostMultiplier: 1.1,
  };

export function calculateFlexFuelCompensation(
  ethanolPercent: number,
  config: FlexFuelConfig =
    defaultFlexFuelConfig,
): FlexFuelResult {
  const clampedEthanol =
    Math.max(
      0,
      Math.min(
        config.maximumEthanolPercent,
        ethanolPercent,
      ),
    );

  const ethanolFraction =
    config.maximumEthanolPercent <=
    0
      ? 0
      : clampedEthanol /
        config.maximumEthanolPercent;

  const fuelMultiplier =
    1 +
    (config.maximumFuelMultiplier -
      1) *
      ethanolFraction;

  const ignitionAdvanceDegrees =
    config.maximumIgnitionAdvanceDegrees *
    ethanolFraction;

  const boostMultiplier =
    1 +
    (config.maximumBoostMultiplier -
      1) *
      ethanolFraction;

  /*
   * Approximate stoichiometric AFR
   * interpolation between petrol and
   * E85 for display purposes.
   */
  const petrolStoich = 14.7;
  const e85Stoich = 9.8;

  const estimatedStoichAfr =
    petrolStoich +
    (e85Stoich -
      petrolStoich) *
      ethanolFraction;

  return {
    active:
      clampedEthanol > 0,

    ethanolPercent:
      clampedEthanol,

    ethanolFraction,

    fuelMultiplier,

    ignitionAdvanceDegrees,

    boostMultiplier,

    estimatedStoichAfr,
  };
}
