import type {
  EcuOutputs,
  EngineConfiguration,
  SensorData,
} from "../types/ecu";

export interface EngineCalculation {
  outputs: EcuOutputs;
  engineLoad: number;
  targetAfr: number;
}

export function calculateEngine(
  config: EngineConfiguration,
  sensors: SensorData,
): EngineCalculation {
  const engineLoad = calculateEngineLoad(sensors);

  const targetAfr = calculateTargetAfr(
    config,
    engineLoad,
  );

  const injectorPulseWidthMs =
    calculateInjectorPulseWidth(
      config,
      sensors,
      engineLoad,
      targetAfr,
    );

  const ignitionTimingDegrees =
    calculateIgnitionTiming(
      config,
      sensors,
      engineLoad,
    );

  const fuelPumpDuty =
    calculateFuelPumpDuty(
      sensors,
      engineLoad,
    );

  const coolingFanDuty =
    calculateCoolingFanDuty(sensors);

  const boostControlDuty =
    calculateBoostControlDuty(
      config,
      sensors,
    );

  return {
    engineLoad,
    targetAfr,

    outputs: {
      injectorPulseWidthMs,
      ignitionTimingDegrees,
      fuelPumpDuty,
      coolingFanDuty,
      boostControlDuty,
    },
  };
}

function calculateEngineLoad(
  sensors: SensorData,
): number {
  const throttleLoad =
    sensors.throttlePosition / 100;

  const mapLoad = Math.min(
    Math.max(
      sensors.manifoldPressureKpa / 100,
      0,
    ),
    1,
  );

  return Math.min(
    Math.max(
      (throttleLoad + mapLoad) / 2,
      0,
    ),
    1,
  );
}

function calculateTargetAfr(
  config: EngineConfiguration,
  engineLoad: number,
): number {
  if (config.fuelType === "diesel") {
    return 14.7;
  }

  if (engineLoad > 0.85) {
    return 12.0;
  }

  if (engineLoad > 0.60) {
    return 12.8;
  }

  if (engineLoad > 0.30) {
    return 13.8;
  }

  return 14.7;
}

function calculateInjectorPulseWidth(
  config: EngineConfiguration,
  sensors: SensorData,
  engineLoad: number,
  targetAfr: number,
): number {
  if (sensors.rpm <= 0) {
    return 0;
  }

  const injectorSize = Math.max(
    config.injectorFlowCc,
    1,
  );

  const baseFuel =
    (engineLoad *
      config.displacementLitres *
      10) /
    injectorSize;

  const afrCorrection =
    14.7 / Math.max(targetAfr, 1);

  const rpmCorrection =
    Math.min(
      sensors.rpm / 4000,
      1.5,
    );

  const pulseWidth =
    baseFuel *
    afrCorrection *
    rpmCorrection;

  return Math.max(
    1,
    Math.min(pulseWidth, 20),
  );
}

function calculateIgnitionTiming(
  config: EngineConfiguration,
  sensors: SensorData,
  engineLoad: number,
): number {
  if (sensors.rpm <= 0) {
    return 0;
  }

  const rpmAdvance = Math.min(
    sensors.rpm / 500,
    20,
  );

  const loadRetard =
    engineLoad * 10;

  const temperatureCorrection =
    sensors.coolantTemperatureC > 100
      ? -3
      : 0;

  const timing =
    config.baseIgnitionTiming +
    rpmAdvance -
    loadRetard +
    temperatureCorrection;

  return Math.max(
    0,
    Math.min(timing, 40),
  );
}

function calculateFuelPumpDuty(
  sensors: SensorData,
  engineLoad: number,
): number {
  if (sensors.rpm <= 0) {
    return 0;
  }

  return Math.min(
    100,
    35 + engineLoad * 65,
  );
}

function calculateCoolingFanDuty(
  sensors: SensorData,
): number {
  const temperature =
    sensors.coolantTemperatureC;

  if (temperature < 90) {
    return 0;
  }

  if (temperature >= 105) {
    return 100;
  }

  return (
    ((temperature - 90) / 15) *
    100
  );
}

function calculateBoostControlDuty(
  config: EngineConfiguration,
  sensors: SensorData,
): number {
  if (
    config.aspiration ===
    "naturally-aspirated"
  ) {
    return 0;
  }

  const targetPressure = 150;

  const pressureError =
    targetPressure -
    sensors.manifoldPressureKpa;

  return Math.min(
    100,
    Math.max(
      0,
      pressureError * 0.5,
    ),
  );
}