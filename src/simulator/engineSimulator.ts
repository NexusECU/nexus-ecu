import type {
  EngineConfiguration,
  SensorData,
} from "../types/ecu";

export class EngineSimulator {
  private readonly config: EngineConfiguration;

  private rpm = 0;
  private throttle = 0;
  private coolant = 25;
  private intakeAir = 25;
  private oilPressure = 0;
  private battery = 12.6;
  private vehicleSpeed = 0;

  private running = false;

  constructor(config: EngineConfiguration) {
    this.config = config;
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    this.rpm = 0;
    this.vehicleSpeed = 0;
    this.oilPressure = 0;
  }

  setThrottle(value: number): void {
    this.throttle = Math.min(
      100,
      Math.max(0, value),
    );
  }

  update(deltaSeconds: number): SensorData {
    if (!this.running) {
      this.rpm = this.approach(
        this.rpm,
        0,
        deltaSeconds,
        2500,
      );

      this.oilPressure = this.approach(
        this.oilPressure,
        0,
        deltaSeconds,
        100,
      );
    } else {
      const idleTarget = this.config.idleRpm ?? 850;

      const throttleTarget =
        idleTarget +
        this.throttle * 65;

      this.rpm = this.approach(
        this.rpm,
        throttleTarget,
        deltaSeconds,
        4500,
      );

      this.oilPressure =
        18 + this.rpm * 0.008;

      this.coolant = Math.min(
        105,
        this.coolant +
          this.throttle *
            deltaSeconds *
            0.015,
      );

      this.vehicleSpeed = Math.max(
        0,
        this.vehicleSpeed +
          (
            this.throttle * 0.8 -
            this.vehicleSpeed * 0.015
          ) *
            deltaSeconds,
      );
    }

    const manifoldPressure =
      this.calculateMap();

    const airFuelRatio =
      this.calculateAfr();

    const engineLoad =
      this.calculateLoad(
        manifoldPressure,
      );

    this.intakeAir =
      this.calculateIat();

    this.battery =
      this.calculateBattery();

    return {
      rpm: this.rpm,

      throttlePosition:
        this.throttle,

      manifoldPressureKpa:
        manifoldPressure,

      intakeAirTemperatureC:
        this.intakeAir,

      coolantTemperatureC:
        this.coolant,

      airFuelRatio:
        airFuelRatio,

      oilPressureKpa:
        this.oilPressure,

      batteryVoltage:
        this.battery,

      vehicleSpeedKph:
        this.vehicleSpeed,

      engineLoad,
    };
  }

  private calculateMap(): number {
    const atmosphericPressure = 101;

    if (!this.running) {
      return atmosphericPressure * 0.3;
    }

    const throttlePressure =
      this.throttle * 0.7;

    const rpmEffect =
      Math.min(
        this.rpm / 7000,
        1,
      ) * 10;

    return Math.min(
      220,
      30 +
        throttlePressure +
        rpmEffect,
    );
  }

  private calculateAfr(): number {
    if (!this.running) {
      return 14.7;
    }

    const load =
      this.throttle / 100;

    return Math.max(
      11.5,
      14.7 -
        load * 3,
    );
  }

  private calculateLoad(
    manifoldPressure: number,
  ): number {
    const mapLoad =
      manifoldPressure / 100;

    const throttleLoad =
      this.throttle / 100;

    return Math.min(
      1,
      Math.max(
        0,
        (mapLoad +
          throttleLoad) /
          2,
      ),
    );
  }

  private calculateIat(): number {
    if (!this.running) {
      return 25;
    }

    return (
      25 +
      this.throttle * 0.12
    );
  }

  private calculateBattery(): number {
    if (!this.running) {
      return 12.6;
    }

    return (
      13.8 +
      Math.random() * 0.15
    );
  }

  private approach(
    current: number,
    target: number,
    deltaSeconds: number,
    rate: number,
  ): number {
    const difference =
      target - current;

    const maximumChange =
      rate * deltaSeconds;

    if (
      Math.abs(difference) <=
      maximumChange
    ) {
      return target;
    }

    return (
      current +
      Math.sign(difference) *
        maximumChange
    );
  }
}