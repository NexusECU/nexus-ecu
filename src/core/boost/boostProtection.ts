export interface BoostProtectionInput {
  engineRunning: boolean;

  manifoldPressureKpa: number;

  atmosphericPressureKpa: number;

  warningBoostBar?: number;

  cutBoostBar?: number;
}

export interface BoostProtectionResult {
  active: boolean;

  warningActive: boolean;

  cutActive: boolean;

  boostKpa: number;

  boostBar: number;

  ignitionRetardDegrees: number;

  fuelCut: boolean;

  boostCut: boolean;
}

export function calculateBoostProtection(
  input: BoostProtectionInput,
): BoostProtectionResult {
  const warningBoostBar =
    Math.max(
      0.1,
      input.warningBoostBar ??
        1.8,
    );

  const cutBoostBar =
    Math.max(
      warningBoostBar +
        0.1,
      input.cutBoostBar ??
        2.2,
    );

  if (!input.engineRunning) {
    return {
      active: false,
      warningActive: false,
      cutActive: false,
      boostKpa: 0,
      boostBar: 0,
      ignitionRetardDegrees: 0,
      fuelCut: false,
      boostCut: false,
    };
  }

  const boostKpa =
    Math.max(
      0,
      input.manifoldPressureKpa -
        input.atmosphericPressureKpa,
    );

  const boostBar =
    boostKpa / 100;

  const warningActive =
    boostBar >=
    warningBoostBar;

  const cutActive =
    boostBar >=
    cutBoostBar;

  const warningRange =
    Math.max(
      0.1,
      cutBoostBar -
        warningBoostBar,
    );

  const warningProgress =
    warningActive
      ? Math.min(
          1,
          Math.max(
            0,
            (
              boostBar -
              warningBoostBar
            ) /
              warningRange,
          ),
        )
      : 0;

  const ignitionRetardDegrees =
    cutActive
      ? 10
      : warningProgress *
        6;

  return {
    active:
      warningActive ||
      cutActive,

    warningActive,

    cutActive,

    boostKpa,

    boostBar,

    ignitionRetardDegrees,

    fuelCut:
      cutActive,

    boostCut:
      warningActive,
  };
}
