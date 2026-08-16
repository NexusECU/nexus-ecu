export type EngineProtectionLevel =
  | "normal"
  | "warning"
  | "limp"
  | "shutdown";

export interface EngineProtectionInput {
  engineRunning: boolean;

  rpm: number;

  redlineRpm: number;

  coolantTemperatureC: number;

  oilPressureKpa: number;

  airFuelRatio: number;

  targetAfr: number;

  engineLoad: number;

  boostWarning: boolean;

  overboostCut: boolean;

  knockDetected: boolean;

  severeKnock: boolean;

  coolantWarningC?: number;

  coolantCriticalC?: number;

  minimumOilPressureKpa?: number;

  lowOilPressureRpmThreshold?: number;

  leanAfrLimit?: number;

  richAfrLimit?: number;
}

export interface EngineProtectionResult {
  active: boolean;

  level: EngineProtectionLevel;

  reasons: string[];

  boostMultiplier: number;

  rpmLimitMultiplier: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  fuelCut: boolean;

  shutdownRequested: boolean;
}

export function calculateEngineProtection(
  input: EngineProtectionInput,
): EngineProtectionResult {
  if (!input.engineRunning) {
    return {
      active: false,
      level: "normal",
      reasons: [],
      boostMultiplier: 1,
      rpmLimitMultiplier: 1,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      fuelCut: false,
      shutdownRequested: false,
    };
  }

  const coolantWarningC =
    input.coolantWarningC ??
    105;

  const coolantCriticalC =
    Math.max(
      coolantWarningC +
        1,
      input.coolantCriticalC ??
        110,
    );

  const minimumOilPressureKpa =
    input.minimumOilPressureKpa ??
    100;

  const lowOilPressureRpmThreshold =
    input.lowOilPressureRpmThreshold ??
    1500;

  const leanAfrLimit =
    input.leanAfrLimit ??
    15.8;

  const richAfrLimit =
    input.richAfrLimit ??
    10.8;

  const reasons: string[] = [];

  let level:
    EngineProtectionLevel =
      "normal";

  let boostMultiplier =
    1;

  let rpmLimitMultiplier =
    1;

  let ignitionRetardDegrees =
    0;

  let fuelEnrichmentPercent =
    0;

  let fuelCut =
    false;

  let shutdownRequested =
    false;

  const setLevel = (
    next:
      EngineProtectionLevel,
  ) => {
    const priority:
      Record<
        EngineProtectionLevel,
        number
      > = {
        normal: 0,
        warning: 1,
        limp: 2,
        shutdown: 3,
      };

    if (
      priority[next] >
      priority[level]
    ) {
      level = next;
    }
  };

  if (
    input.coolantTemperatureC >=
    coolantCriticalC
  ) {
    reasons.push(
      "CRITICAL COOLANT TEMPERATURE",
    );

    setLevel(
      "limp",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.25,
      );

    rpmLimitMultiplier =
      Math.min(
        rpmLimitMultiplier,
        0.7,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        8,
      );

    fuelEnrichmentPercent =
      Math.max(
        fuelEnrichmentPercent,
        8,
      );
  } else if (
    input.coolantTemperatureC >=
    coolantWarningC
  ) {
    reasons.push(
      "HIGH COOLANT TEMPERATURE",
    );

    setLevel(
      "warning",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.65,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        3,
      );

    fuelEnrichmentPercent =
      Math.max(
        fuelEnrichmentPercent,
        4,
      );
  }

  if (
    input.rpm >
      lowOilPressureRpmThreshold &&
    input.oilPressureKpa <
      minimumOilPressureKpa
  ) {
    reasons.push(
      "LOW OIL PRESSURE",
    );

    setLevel(
      "shutdown",
    );

    boostMultiplier = 0;

    rpmLimitMultiplier =
      Math.min(
        rpmLimitMultiplier,
        0.5,
      );

    fuelCut =
      true;

    shutdownRequested =
      true;
  }

  if (
    input.airFuelRatio >
      leanAfrLimit &&
    input.engineLoad >
      0.55
  ) {
    reasons.push(
      "LEAN AFR",
    );

    setLevel(
      "limp",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.35,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        6,
      );

    fuelEnrichmentPercent =
      Math.max(
        fuelEnrichmentPercent,
        12,
      );
  }

  if (
    input.airFuelRatio <
      richAfrLimit &&
    input.engineLoad >
      0.4
  ) {
    reasons.push(
      "RICH AFR",
    );

    setLevel(
      "warning",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.8,
      );
  }

  const targetAfrError =
    input.airFuelRatio -
    input.targetAfr;

  if (
    targetAfrError >
      1.5 &&
    input.engineLoad >
      0.65
  ) {
    reasons.push(
      "AFR TARGET DEVIATION",
    );

    setLevel(
      "warning",
    );

    fuelEnrichmentPercent =
      Math.max(
        fuelEnrichmentPercent,
        6,
      );
  }

  if (
    input.boostWarning
  ) {
    reasons.push(
      "BOOST WARNING",
    );

    setLevel(
      "warning",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.55,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        4,
      );
  }

  if (
    input.overboostCut
  ) {
    reasons.push(
      "OVERBOOST CUT",
    );

    setLevel(
      "limp",
    );

    boostMultiplier = 0;

    rpmLimitMultiplier =
      Math.min(
        rpmLimitMultiplier,
        0.75,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        8,
      );

    fuelCut =
      true;
  }

  if (
    input.knockDetected
  ) {
    reasons.push(
      "KNOCK DETECTED",
    );

    setLevel(
      "warning",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.7,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        5,
      );
  }

  if (
    input.severeKnock
  ) {
    reasons.push(
      "SEVERE KNOCK",
    );

    setLevel(
      "limp",
    );

    boostMultiplier =
      Math.min(
        boostMultiplier,
        0.2,
      );

    rpmLimitMultiplier =
      Math.min(
        rpmLimitMultiplier,
        0.7,
      );

    ignitionRetardDegrees =
      Math.max(
        ignitionRetardDegrees,
        10,
      );
  }

  if (
    input.rpm >
    input.redlineRpm *
      1.02
  ) {
    reasons.push(
      "ENGINE OVERSPEED",
    );

    setLevel(
      "limp",
    );

    rpmLimitMultiplier =
      Math.min(
        rpmLimitMultiplier,
        0.85,
      );

    fuelCut =
      true;
  }

  return {
    active:
      level !==
      "normal",

    level,

    reasons,

    boostMultiplier,

    rpmLimitMultiplier,

    ignitionRetardDegrees,

    fuelEnrichmentPercent,

    fuelCut,

    shutdownRequested,
  };
}
