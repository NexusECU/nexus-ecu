import type {
  CanFrame,
} from "./canParser";

export type DecodedCanSignal = {
  key: string;

  name: string;

  shortName: string;

  value: number;

  unit: string;

  pid: number;

  sourceId: string;

  timestampMs: number;
};

type SignalDefinition = {
  pid: number;

  key: string;

  name: string;

  shortName: string;

  unit: string;

  requiredBytes: number;

  decode: (
    bytes: number[],
  ) => number;
};

const definitions:
  SignalDefinition[] = [
    {
      pid: 0x04,
      key: "engineLoad",
      name: "Calculated Engine Load",
      shortName: "LOAD",
      unit: "%",
      requiredBytes: 1,
      decode: ([a]) =>
        a * 100 / 255,
    },

    {
      pid: 0x05,
      key: "coolantTemperature",
      name: "Engine Coolant Temperature",
      shortName: "COOLANT",
      unit: "°C",
      requiredBytes: 1,
      decode: ([a]) =>
        a - 40,
    },

    {
      pid: 0x06,
      key: "shortTermFuelTrimBank1",
      name: "Short Term Fuel Trim Bank 1",
      shortName: "STFT B1",
      unit: "%",
      requiredBytes: 1,
      decode: ([a]) =>
        (a - 128) *
        100 /
        128,
    },

    {
      pid: 0x07,
      key: "longTermFuelTrimBank1",
      name: "Long Term Fuel Trim Bank 1",
      shortName: "LTFT B1",
      unit: "%",
      requiredBytes: 1,
      decode: ([a]) =>
        (a - 128) *
        100 /
        128,
    },

    {
      pid: 0x0A,
      key: "fuelPressure",
      name: "Fuel Pressure",
      shortName: "FUEL PRESS",
      unit: "kPa",
      requiredBytes: 1,
      decode: ([a]) =>
        a * 3,
    },

    {
      pid: 0x0B,
      key: "manifoldPressure",
      name: "Intake Manifold Absolute Pressure",
      shortName: "MAP",
      unit: "kPa",
      requiredBytes: 1,
      decode: ([a]) =>
        a,
    },

    {
      pid: 0x0C,
      key: "engineRpm",
      name: "Engine RPM",
      shortName: "RPM",
      unit: "rpm",
      requiredBytes: 2,
      decode: ([a, b]) =>
        (
          a * 256 +
          b
        ) /
        4,
    },

    {
      pid: 0x0D,
      key: "vehicleSpeed",
      name: "Vehicle Speed",
      shortName: "SPEED",
      unit: "km/h",
      requiredBytes: 1,
      decode: ([a]) =>
        a,
    },

    {
      pid: 0x0F,
      key: "intakeAirTemperature",
      name: "Intake Air Temperature",
      shortName: "IAT",
      unit: "°C",
      requiredBytes: 1,
      decode: ([a]) =>
        a - 40,
    },

    {
      pid: 0x10,
      key: "massAirFlow",
      name: "Mass Air Flow",
      shortName: "MAF",
      unit: "g/s",
      requiredBytes: 2,
      decode: ([a, b]) =>
        (
          a * 256 +
          b
        ) /
        100,
    },

    {
      pid: 0x11,
      key: "throttlePosition",
      name: "Throttle Position",
      shortName: "TPS",
      unit: "%",
      requiredBytes: 1,
      decode: ([a]) =>
        a * 100 / 255,
    },

    {
      pid: 0x2F,
      key: "fuelLevel",
      name: "Fuel Tank Level Input",
      shortName: "FUEL LEVEL",
      unit: "%",
      requiredBytes: 1,
      decode: ([a]) =>
        a * 100 / 255,
    },

    {
      pid: 0x33,
      key: "barometricPressure",
      name: "Absolute Barometric Pressure",
      shortName: "BARO",
      unit: "kPa",
      requiredBytes: 1,
      decode: ([a]) =>
        a,
    },

    {
      pid: 0x42,
      key: "controlModuleVoltage",
      name: "Control Module Voltage",
      shortName: "ECU VOLTS",
      unit: "V",
      requiredBytes: 2,
      decode: ([a, b]) =>
        (
          a * 256 +
          b
        ) /
        1000,
    },

    {
      pid: 0x46,
      key: "ambientAirTemperature",
      name: "Ambient Air Temperature",
      shortName: "AMBIENT",
      unit: "°C",
      requiredBytes: 1,
      decode: ([a]) =>
        a - 40,
    },

    {
      pid: 0x5C,
      key: "engineOilTemperature",
      name: "Engine Oil Temperature",
      shortName: "OIL TEMP",
      unit: "°C",
      requiredBytes: 1,
      decode: ([a]) =>
        a - 40,
    },
  ];

const definitionByPid =
  new Map(
    definitions.map(
      (definition) => [
        definition.pid,
        definition,
      ],
    ),
  );

function diagnosticPayload(
  frame: CanFrame,
): number[] | null {
  if (
    frame.remote ||
    frame.data.length <
      2
  ) {
    return null;
  }

  /*
   * ISO-TP single-frame CAN payload:
   * 04 41 0C AA BB ...
   *
   * Some adapters/log sources may already strip
   * the ISO-TP PCI byte, so also accept:
   * 41 0C AA BB ...
   */
  const first =
    frame.data[0];

  if (
    (first & 0xF0) ===
      0x00 &&
    (first & 0x0F) >
      0 &&
    (first & 0x0F) <=
      7
  ) {
    const length =
      first & 0x0F;

    return frame.data.slice(
      1,
      1 + length,
    );
  }

  return frame.data;
}

export function decodeObdMode01Frame(
  frame: CanFrame,
): DecodedCanSignal | null {
  const payload =
    diagnosticPayload(
      frame,
    );

  if (
    !payload ||
    payload.length <
      3
  ) {
    return null;
  }

  const responseMode =
    payload[0];

  const pid =
    payload[1];

  if (
    responseMode !==
    0x41
  ) {
    return null;
  }

  const definition =
    definitionByPid.get(
      pid,
    );

  if (!definition) {
    return null;
  }

  const bytes =
    payload.slice(
      2,
      2 +
        definition
          .requiredBytes,
    );

  if (
    bytes.length <
    definition
      .requiredBytes
  ) {
    return null;
  }

  const value =
    definition.decode(
      bytes,
    );

  if (
    !Number.isFinite(
      value,
    )
  ) {
    return null;
  }

  return {
    key:
      definition.key,

    name:
      definition.name,

    shortName:
      definition.shortName,

    value,

    unit:
      definition.unit,

    pid,

    sourceId:
      `0x${frame.idHex}`,

    timestampMs:
      frame.timestampMs,
  };
}

export function latestDecodedSignals(
  frames: CanFrame[],
): DecodedCanSignal[] {
  const latest =
    new Map<
      string,
      DecodedCanSignal
    >();

  frames.forEach(
    (frame) => {
      const signal =
        decodeObdMode01Frame(
          frame,
        );

      if (!signal) {
        return;
      }

      latest.set(
        signal.key,
        signal,
      );
    },
  );

  return Array.from(
    latest.values(),
  ).sort(
    (
      a,
      b,
    ) =>
      a.shortName
        .localeCompare(
          b.shortName,
        ),
  );
}

export function formatSignalValue(
  signal:
    DecodedCanSignal,
): string {
  if (
    signal.unit ===
      "rpm" ||
    signal.unit ===
      "km/h" ||
    signal.unit ===
      "kPa" ||
    signal.unit ===
      "°C"
  ) {
    return signal.value
      .toFixed(
        0,
      );
  }

  if (
    signal.unit ===
      "V"
  ) {
    return signal.value
      .toFixed(
        2,
      );
  }

  return signal.value
    .toFixed(
      1,
    );
}
