export type SimulatedSensorFault =
  | "map"
  | "tps"
  | "coolant"
  | "iat"
  | "wideband"
  | "oil-pressure"
  | "battery";

export interface SensorFaultConfig {
  mapFallbackKpa: number;

  tpsFallbackPercent: number;

  coolantFallbackC: number;

  iatFallbackC: number;

  widebandFallbackAfr: number;

  oilPressureFallbackKpa: number;

  batteryFallbackV: number;
}

export interface SensorFaultInput {
  activeFaults: SimulatedSensorFault[];

  rpm: number;

  throttlePosition: number;

  manifoldPressureKpa: number;

  coolantTemperatureC: number;

  intakeAirTemperatureC: number;

  airFuelRatio: number;

  oilPressureKpa: number;

  batteryVoltage: number;
}

export interface SensorFaultResult {
  active: boolean;

  activeFaults: SimulatedSensorFault[];

  dtcs: string[];

  fallbackValues: {
    throttlePosition: number;

    manifoldPressureKpa: number;

    coolantTemperatureC: number;

    intakeAirTemperatureC: number;

    airFuelRatio: number;

    oilPressureKpa: number;

    batteryVoltage: number;
  };

  limpModeRequested: boolean;

  boostMultiplier: number;

  torqueMultiplier: number;
}

export const defaultSensorFaultConfig:
  SensorFaultConfig = {
    mapFallbackKpa: 100,

    tpsFallbackPercent: 12,

    coolantFallbackC: 95,

    iatFallbackC: 35,

    widebandFallbackAfr: 14.7,

    oilPressureFallbackKpa: 180,

    batteryFallbackV: 12,
  };

export function calculateSensorFaults(
  input: SensorFaultInput,
  config: SensorFaultConfig =
    defaultSensorFaultConfig,
): SensorFaultResult {
  const faults =
    [...new Set(
      input.activeFaults,
    )];

  const has =
    (
      fault:
        SimulatedSensorFault,
    ) =>
      faults.includes(
        fault,
      );

  const dtcs: string[] = [];

  if (has("map")) {
    dtcs.push(
      "P0105 MAP SENSOR FAULT",
    );
  }

  if (has("tps")) {
    dtcs.push(
      "P0120 THROTTLE POSITION SENSOR FAULT",
    );
  }

  if (has("coolant")) {
    dtcs.push(
      "P0115 COOLANT TEMPERATURE SENSOR FAULT",
    );
  }

  if (has("iat")) {
    dtcs.push(
      "P0110 INTAKE AIR TEMPERATURE SENSOR FAULT",
    );
  }

  if (has("wideband")) {
    dtcs.push(
      "P0130 WIDEBAND / O2 SENSOR FAULT",
    );
  }

  if (has("oil-pressure")) {
    dtcs.push(
      "P0520 OIL PRESSURE SENSOR FAULT",
    );
  }

  if (has("battery")) {
    dtcs.push(
      "P0560 SYSTEM VOLTAGE SENSOR FAULT",
    );
  }

  const criticalFault =
    has("map") ||
    has("tps") ||
    has("oil-pressure");

  const multiFault =
    faults.length >= 3;

  const limpModeRequested =
    criticalFault ||
    multiFault;

  let boostMultiplier =
    1;

  let torqueMultiplier =
    1;

  if (
    faults.length > 0
  ) {
    boostMultiplier =
      0.75;

    torqueMultiplier =
      0.85;
  }

  if (
    limpModeRequested
  ) {
    boostMultiplier =
      0.35;

    torqueMultiplier =
      0.5;
  }

  return {
    active:
      faults.length > 0,

    activeFaults:
      faults,

    dtcs,

    fallbackValues: {
      throttlePosition:
        has("tps")
          ? config
              .tpsFallbackPercent
          : input
              .throttlePosition,

      manifoldPressureKpa:
        has("map")
          ? config
              .mapFallbackKpa
          : input
              .manifoldPressureKpa,

      coolantTemperatureC:
        has("coolant")
          ? config
              .coolantFallbackC
          : input
              .coolantTemperatureC,

      intakeAirTemperatureC:
        has("iat")
          ? config
              .iatFallbackC
          : input
              .intakeAirTemperatureC,

      airFuelRatio:
        has("wideband")
          ? config
              .widebandFallbackAfr
          : input
              .airFuelRatio,

      oilPressureKpa:
        has("oil-pressure")
          ? config
              .oilPressureFallbackKpa
          : input
              .oilPressureKpa,

      batteryVoltage:
        has("battery")
          ? config
              .batteryFallbackV
          : input
              .batteryVoltage,
    },

    limpModeRequested,

    boostMultiplier,

    torqueMultiplier,
  };
}
