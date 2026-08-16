export interface VirtualDynoInput {
  engineRunning: boolean;
  rpm: number;
  engineLoad: number;
  manifoldPressureKpa: number;
  displacementLitres: number;
  cylinders: number;
  aspiration:
    | "naturally-aspirated"
    | "turbocharged"
    | "supercharged"
    | "twin-turbo";
}

export interface VirtualDynoResult {
  active: boolean;
  torqueNm: number;
  powerKw: number;
  horsepower: number;
  boostBar: number;
}

export function calculateVirtualDyno(
  input: VirtualDynoInput,
): VirtualDynoResult {
  if (!input.engineRunning || input.rpm <= 0) {
    return {
      active: false,
      torqueNm: 0,
      powerKw: 0,
      horsepower: 0,
      boostBar: 0,
    };
  }

  const atmosphericPressureKpa = 101.3;

  const boostKpa = Math.max(
    0,
    input.manifoldPressureKpa -
      atmosphericPressureKpa,
  );

  const boostBar = boostKpa / 100;

  const load = Math.max(
    0,
    Math.min(1, input.engineLoad),
  );

  const displacementFactor = Math.max(
    0.8,
    input.displacementLitres,
  );

  const cylinderFactor = Math.max(
    0.8,
    input.cylinders / 4,
  );

  const aspirationMultiplier =
    input.aspiration ===
    "naturally-aspirated"
      ? 1
      : 1 +
        Math.min(2.2, boostBar) *
          0.75;

  const rpmEfficiency = Math.max(
    0.55,
    1 -
      Math.abs(input.rpm - 5200) /
        9000,
  );

  const torqueNm =
    displacementFactor *
    105 *
    cylinderFactor *
    aspirationMultiplier *
    (0.35 + load * 0.65) *
    rpmEfficiency;

  const powerKw =
    torqueNm * input.rpm / 9549;

  const horsepower =
    powerKw * 1.34102;

  return {
    active: true,
    torqueNm: Math.max(0, torqueNm),
    powerKw: Math.max(0, powerKw),
    horsepower: Math.max(0, horsepower),
    boostBar,
  };
}
