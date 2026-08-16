export interface SensorCalibrationSettings {
  tpsMinRaw: number;

  tpsMaxRaw: number;

  mapMinKpa: number;

  mapMaxKpa: number;

  widebandMinAfr: number;

  widebandMaxAfr: number;

  coolantOffsetC: number;

  iatOffsetC: number;

  oilPressureScale: number;

  batteryVoltageScale: number;
}

export interface SensorCalibrationResult {
  throttlePosition: number;

  manifoldPressureKpa: number;

  airFuelRatio: number;

  coolantTemperatureC: number;

  intakeAirTemperatureC: number;

  oilPressureKpa: number;

  batteryVoltage: number;
}

export const defaultSensorCalibrationSettings:
  SensorCalibrationSettings = {
    tpsMinRaw: 0,

    tpsMaxRaw: 100,

    mapMinKpa: 20,

    mapMaxKpa: 450,

    widebandMinAfr: 10,

    widebandMaxAfr: 20,

    coolantOffsetC: 0,

    iatOffsetC: 0,

    oilPressureScale: 1,

    batteryVoltageScale: 1,
  };

export function clampSensorCalibrationSettings(
  settings: SensorCalibrationSettings,
): SensorCalibrationSettings {
  return {
    tpsMinRaw:
      Math.max(
        0,
        Math.min(
          95,
          settings.tpsMinRaw,
        ),
      ),

    tpsMaxRaw:
      Math.max(
        settings.tpsMinRaw + 1,
        Math.min(
          100,
          settings.tpsMaxRaw,
        ),
      ),

    mapMinKpa:
      Math.max(
        0,
        Math.min(
          150,
          settings.mapMinKpa,
        ),
      ),

    mapMaxKpa:
      Math.max(
        settings.mapMinKpa + 10,
        Math.min(
          500,
          settings.mapMaxKpa,
        ),
      ),

    widebandMinAfr:
      Math.max(
        5,
        Math.min(
          15,
          settings.widebandMinAfr,
        ),
      ),

    widebandMaxAfr:
      Math.max(
        settings.widebandMinAfr + 1,
        Math.min(
          25,
          settings.widebandMaxAfr,
        ),
      ),

    coolantOffsetC:
      Math.max(
        -30,
        Math.min(
          30,
          settings.coolantOffsetC,
        ),
      ),

    iatOffsetC:
      Math.max(
        -30,
        Math.min(
          30,
          settings.iatOffsetC,
        ),
      ),

    oilPressureScale:
      Math.max(
        0.5,
        Math.min(
          1.5,
          settings.oilPressureScale,
        ),
      ),

    batteryVoltageScale:
      Math.max(
        0.8,
        Math.min(
          1.2,
          settings.batteryVoltageScale,
        ),
      ),
  };
}

export function applySensorCalibration(
  input: SensorCalibrationResult,
  settings: SensorCalibrationSettings,
): SensorCalibrationResult {
  const calibrated =
    clampSensorCalibrationSettings(
      settings,
    );

  const tpsRange =
    calibrated.tpsMaxRaw -
    calibrated.tpsMinRaw;

  const throttlePosition =
    tpsRange <= 0
      ? input.throttlePosition
      : (
          input.throttlePosition -
          calibrated.tpsMinRaw
        ) /
          tpsRange *
          100;

  return {
    throttlePosition:
      Math.max(
        0,
        Math.min(
          100,
          throttlePosition,
        ),
      ),

    manifoldPressureKpa:
      Math.max(
        calibrated.mapMinKpa,
        Math.min(
          calibrated.mapMaxKpa,
          input.manifoldPressureKpa,
        ),
      ),

    airFuelRatio:
      Math.max(
        calibrated.widebandMinAfr,
        Math.min(
          calibrated.widebandMaxAfr,
          input.airFuelRatio,
        ),
      ),

    coolantTemperatureC:
      input.coolantTemperatureC +
      calibrated.coolantOffsetC,

    intakeAirTemperatureC:
      input.intakeAirTemperatureC +
      calibrated.iatOffsetC,

    oilPressureKpa:
      Math.max(
        0,
        input.oilPressureKpa *
        calibrated.oilPressureScale,
      ),

    batteryVoltage:
      Math.max(
        0,
        input.batteryVoltage *
        calibrated.batteryVoltageScale,
      ),
  };
}
