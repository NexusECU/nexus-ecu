export interface ProtectionSettings {
  coolantWarningC: number;

  coolantCriticalC: number;

  minimumOilPressureKpa: number;

  lowOilPressureRpmThreshold: number;

  boostWarningBar: number;

  boostCutBar: number;

  leanAfrLimit: number;

  richAfrLimit: number;

  knockSensitivity: number;

  maximumRevMultiplier: number;

  antiLagMaxCoolantC: number;

  antiLagMaxIatC: number;

  brakeBoostMaxCoolantC: number;

  brakeBoostMaxIatC: number;
}

export const defaultProtectionSettings:
  ProtectionSettings = {
    coolantWarningC: 105,

    coolantCriticalC: 110,

    minimumOilPressureKpa: 100,

    lowOilPressureRpmThreshold: 1500,

    boostWarningBar: 1.8,

    boostCutBar: 2.2,

    leanAfrLimit: 15.8,

    richAfrLimit: 10.8,

    knockSensitivity: 1,

    maximumRevMultiplier: 1,

    antiLagMaxCoolantC: 105,

    antiLagMaxIatC: 70,

    brakeBoostMaxCoolantC: 105,

    brakeBoostMaxIatC: 70,
  };

export function clampProtectionSettings(
  settings: ProtectionSettings,
): ProtectionSettings {
  return {
    coolantWarningC:
      Math.max(
        80,
        Math.min(
          120,
          settings.coolantWarningC,
        ),
      ),

    coolantCriticalC:
      Math.max(
        settings.coolantWarningC +
          1,
        Math.min(
          130,
          settings.coolantCriticalC,
        ),
      ),

    minimumOilPressureKpa:
      Math.max(
        20,
        Math.min(
          400,
          settings.minimumOilPressureKpa,
        ),
      ),

    lowOilPressureRpmThreshold:
      Math.max(
        500,
        Math.min(
          5000,
          settings.lowOilPressureRpmThreshold,
        ),
      ),

    boostWarningBar:
      Math.max(
        0.2,
        Math.min(
          3.5,
          settings.boostWarningBar,
        ),
      ),

    boostCutBar:
      Math.max(
        settings.boostWarningBar +
          0.1,
        Math.min(
          4,
          settings.boostCutBar,
        ),
      ),

    leanAfrLimit:
      Math.max(
        13,
        Math.min(
          20,
          settings.leanAfrLimit,
        ),
      ),

    richAfrLimit:
      Math.max(
        8,
        Math.min(
          14,
          settings.richAfrLimit,
        ),
      ),

    knockSensitivity:
      Math.max(
        0.5,
        Math.min(
          2,
          settings.knockSensitivity,
        ),
      ),

    maximumRevMultiplier:
      Math.max(
        0.8,
        Math.min(
          1.2,
          settings.maximumRevMultiplier,
        ),
      ),

    antiLagMaxCoolantC:
      Math.max(
        80,
        Math.min(
          120,
          settings.antiLagMaxCoolantC,
        ),
      ),

    antiLagMaxIatC:
      Math.max(
        40,
        Math.min(
          100,
          settings.antiLagMaxIatC,
        ),
      ),

    brakeBoostMaxCoolantC:
      Math.max(
        80,
        Math.min(
          120,
          settings.brakeBoostMaxCoolantC,
        ),
      ),

    brakeBoostMaxIatC:
      Math.max(
        40,
        Math.min(
          100,
          settings.brakeBoostMaxIatC,
        ),
      ),
  };
}
