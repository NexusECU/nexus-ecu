export type CanBusStatus =
  | "offline"
  | "online"
  | "warning"
  | "bus-off";

export interface CanFrame {
  id: string;

  name: string;

  dlc: number;

  data: number[];

  timestampMs: number;

  frequencyHz: number;
}

export interface CanBusInput {
  engineRunning: boolean;

  rpm: number;

  throttlePosition: number;

  manifoldPressureKpa: number;

  coolantTemperatureC: number;

  intakeAirTemperatureC: number;

  airFuelRatio: number;

  oilPressureKpa: number;

  batteryVoltage: number;

  vehicleSpeedKph: number;

  currentGear: number;

  engineLoadPercent: number;
}

export interface CanBusState {
  enabled: boolean;

  status: CanBusStatus;

  bitrateKbps: number;

  busLoadPercent: number;

  txFrames: number;

  rxFrames: number;

  errorCount: number;

  droppedFrames: number;

  lastFrameId: string;

  frames: CanFrame[];
}

export interface CanBusConfig {
  enabled: boolean;

  bitrateKbps: number;

  maximumFrames: number;
}

export const defaultCanBusConfig:
  CanBusConfig = {
    enabled: true,

    bitrateKbps: 500,

    maximumFrames: 60,
  };

function clampByte(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      255,
      Math.round(value),
    ),
  );
}

function splitUnsigned16(
  value: number,
): [number, number] {
  const safe =
    Math.max(
      0,
      Math.min(
        65535,
        Math.round(value),
      ),
    );

  return [
    safe & 0xff,
    (safe >> 8) & 0xff,
  ];
}

function createFrame(
  id: string,
  name: string,
  data: number[],
  timestampMs: number,
  frequencyHz: number,
): CanFrame {
  return {
    id,
    name,
    dlc:
      Math.min(
        8,
        data.length,
      ),
    data:
      data
        .slice(0, 8)
        .map(
          clampByte,
        ),
    timestampMs,
    frequencyHz,
  };
}

export class CanBusSimulator {
  private state:
    CanBusState;

  private lastFastBroadcastMs =
    0;

  private lastMediumBroadcastMs =
    0;

  private lastSlowBroadcastMs =
    0;

  constructor(
    config:
      CanBusConfig =
        defaultCanBusConfig,
  ) {
    this.state = {
      enabled:
        config.enabled,
      status:
        config.enabled
          ? "online"
          : "offline",
      bitrateKbps:
        config.bitrateKbps,
      busLoadPercent: 0,
      txFrames: 0,
      rxFrames: 0,
      errorCount: 0,
      droppedFrames: 0,
      lastFrameId: "—",
      frames: [],
    };
  }

  setEnabled(
    enabled: boolean,
  ): void {
    this.state.enabled =
      enabled;

    this.state.status =
      enabled
        ? "online"
        : "offline";
  }

  setBitrate(
    bitrateKbps: number,
  ): void {
    const supported =
      [125, 250, 500, 1000];

    const closest =
      supported.reduce(
        (previous, current) =>
          Math.abs(
            current -
              bitrateKbps,
          ) <
          Math.abs(
            previous -
              bitrateKbps,
          )
            ? current
            : previous,
        supported[0],
      );

    this.state.bitrateKbps =
      closest;
  }

  clear(): void {
    this.state.frames = [];
    this.state.txFrames = 0;
    this.state.rxFrames = 0;
    this.state.errorCount = 0;
    this.state.droppedFrames = 0;
    this.state.lastFrameId = "—";
    this.state.busLoadPercent = 0;
  }

  update(
    input: CanBusInput,
    timestampMs: number,
  ): CanBusState {
    if (
      !this.state.enabled
    ) {
      this.state.status =
        "offline";

      return this.getState();
    }

    this.state.status =
      "online";

    const generated:
      CanFrame[] = [];

    if (
      timestampMs -
        this.lastFastBroadcastMs >=
      20
    ) {
      this.lastFastBroadcastMs =
        timestampMs;

      const rpmBytes =
        splitUnsigned16(
          input.rpm,
        );

      const speedBytes =
        splitUnsigned16(
          input.vehicleSpeedKph *
            100,
        );

      generated.push(
        createFrame(
          "0x100",
          "ENGINE_SPEED",
          [
            ...rpmBytes,
            clampByte(
              input
                .throttlePosition *
                2.55,
            ),
            clampByte(
              input
                .engineLoadPercent *
                2.55,
            ),
            ...speedBytes,
          ],
          timestampMs,
          50,
        ),
      );

      const mapBytes =
        splitUnsigned16(
          input
            .manifoldPressureKpa *
            10,
        );

      generated.push(
        createFrame(
          "0x101",
          "ENGINE_AIR",
          [
            ...mapBytes,
            clampByte(
              input
                .airFuelRatio *
                10,
            ),
            clampByte(
              input
                .intakeAirTemperatureC +
                40,
            ),
          ],
          timestampMs,
          50,
        ),
      );
    }

    if (
      timestampMs -
        this.lastMediumBroadcastMs >=
      100
    ) {
      this.lastMediumBroadcastMs =
        timestampMs;

      const oilBytes =
        splitUnsigned16(
          input.oilPressureKpa,
        );

      generated.push(
        createFrame(
          "0x200",
          "ENGINE_TEMPS",
          [
            clampByte(
              input
                .coolantTemperatureC +
                40,
            ),
            clampByte(
              input
                .intakeAirTemperatureC +
                40,
            ),
            ...oilBytes,
            clampByte(
              input
                .batteryVoltage *
                10,
            ),
          ],
          timestampMs,
          10,
        ),
      );

      generated.push(
        createFrame(
          "0x201",
          "DRIVETRAIN",
          [
            clampByte(
              input.currentGear,
            ),
            clampByte(
              input
                .vehicleSpeedKph,
            ),
            clampByte(
              input
                .throttlePosition *
                2.55,
            ),
          ],
          timestampMs,
          10,
        ),
      );
    }

    if (
      timestampMs -
        this.lastSlowBroadcastMs >=
      500
    ) {
      this.lastSlowBroadcastMs =
        timestampMs;

      generated.push(
        createFrame(
          "0x300",
          "ECU_HEARTBEAT",
          [
            input.engineRunning
              ? 1
              : 0,
            clampByte(
              this.state
                .bitrateKbps /
                10,
            ),
            clampByte(
              this.state
                .errorCount,
            ),
          ],
          timestampMs,
          2,
        ),
      );
    }

    for (
      const frame of generated
    ) {
      this.state.frames.push(
        frame,
      );

      this.state.txFrames +=
        1;

      this.state.rxFrames +=
        1;

      this.state.lastFrameId =
        frame.id;
    }

    if (
      this.state.frames.length >
      defaultCanBusConfig
        .maximumFrames
    ) {
      this.state.frames =
        this.state.frames.slice(
          -defaultCanBusConfig
            .maximumFrames,
        );
    }

    const estimatedFramesPerSecond =
      50 * 2 +
      10 * 2 +
      2;

    const bitsPerFrame =
      128;

    const availableBitsPerSecond =
      this.state.bitrateKbps *
      1000;

    this.state.busLoadPercent =
      Math.min(
        100,
        estimatedFramesPerSecond *
          bitsPerFrame /
          Math.max(
            1,
            availableBitsPerSecond,
          ) *
          100,
      );

    if (
      this.state.busLoadPercent >
      85
    ) {
      this.state.status =
        "warning";
    }

    return this.getState();
  }

  getState():
    CanBusState {
    return {
      ...this.state,

      frames:
        this.state.frames.map(
          (frame) => ({
            ...frame,
            data: [
              ...frame.data,
            ],
          }),
        ),
    };
  }
}
