export interface BoostByGearConfig {
  enabled: boolean;

  gearMultipliers: Record<number, number>;
}

export interface BoostByGearInput {
  engineRunning: boolean;

  currentGear: number;

  baseBoostControlDuty: number;
}

export interface BoostByGearResult {
  enabled: boolean;

  active: boolean;

  currentGear: number;

  multiplier: number;

  baseBoostControlDuty: number;

  limitedBoostControlDuty: number;

  reason: string;
}

export const defaultBoostByGearConfig:
  BoostByGearConfig = {
    enabled: false,

    gearMultipliers: {
      1: 0.55,
      2: 0.7,
      3: 0.82,
      4: 0.92,
      5: 1,
      6: 1,
    },
  };

export function calculateBoostByGear(
  input: BoostByGearInput,
  config: BoostByGearConfig =
    defaultBoostByGearConfig,
): BoostByGearResult {
  const currentGear =
    Math.max(
      1,
      Math.min(
        6,
        Math.round(
          input.currentGear,
        ),
      ),
    );

  const multiplier =
    Math.max(
      0,
      Math.min(
        1.25,
        config.gearMultipliers[
          currentGear
        ] ?? 1,
      ),
    );

  if (!config.enabled) {
    return {
      enabled: false,
      active: false,
      currentGear,
      multiplier: 1,
      baseBoostControlDuty:
        input.baseBoostControlDuty,
      limitedBoostControlDuty:
        input.baseBoostControlDuty,
      reason: "DISABLED",
    };
  }

  if (!input.engineRunning) {
    return {
      enabled: true,
      active: false,
      currentGear,
      multiplier,
      baseBoostControlDuty:
        input.baseBoostControlDuty,
      limitedBoostControlDuty:
        input.baseBoostControlDuty,
      reason: "ENGINE OFF",
    };
  }

  const limitedBoostControlDuty =
    Math.max(
      0,
      Math.min(
        100,
        input.baseBoostControlDuty *
          multiplier,
      ),
    );

  return {
    enabled: true,
    active:
      multiplier < 0.999,
    currentGear,
    multiplier,
    baseBoostControlDuty:
      input.baseBoostControlDuty,
    limitedBoostControlDuty,
    reason:
      multiplier < 0.999
        ? "LIMITING"
        : "FULL BOOST",
  };
}
