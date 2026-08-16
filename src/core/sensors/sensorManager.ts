import type {
  SensorDefinition,
  SensorLimits,
  SensorReading,
  SensorStatus,
  SensorType,
} from "./sensorTypes";

export class SensorManager {
  private definitions =
    new Map<
      SensorType,
      SensorDefinition
    >();

  private readings =
    new Map<
      SensorType,
      SensorReading
    >();

  private limits =
    new Map<
      SensorType,
      SensorLimits
    >();

  registerSensor(
    definition: SensorDefinition,
    limits?: SensorLimits,
  ): void {
    this.definitions.set(
      definition.id,
      definition,
    );

    if (limits) {
      this.limits.set(
        definition.id,
        limits,
      );
    }

    this.setReading(
      definition.id,
      definition.defaultValue,
    );
  }

  setReading(
    id: SensorType,
    value: number,
  ): void {
    const definition =
      this.definitions.get(id);

    if (!definition) {
      return;
    }

    const status =
      this.evaluateStatus(
        id,
        value,
      );

    this.readings.set(id, {
      id,
      value,
      unit: definition.unit,
      status,
      timestamp: Date.now(),
    });
  }

  getReading(
    id: SensorType,
  ): SensorReading | undefined {
    return this.readings.get(id);
  }

  getValue(
    id: SensorType,
  ): number {
    return (
      this.readings.get(id)
        ?.value ??
      0
    );
  }

  getStatus(
    id: SensorType,
  ): SensorStatus {
    return (
      this.readings.get(id)
        ?.status ??
      "disconnected"
    );
  }

  getAllReadings(): SensorReading[] {
    return Array.from(
      this.readings.values(),
    );
  }

  getFaults(): SensorReading[] {
    return this.getAllReadings().filter(
      (reading) =>
        reading.status ===
        "fault",
    );
  }

  private evaluateStatus(
    id: SensorType,
    value: number,
  ): SensorStatus {
    const definition =
      this.definitions.get(id);

    if (!definition) {
      return "disconnected";
    }

    if (
      value <
        definition.minimum ||
      value >
        definition.maximum
    ) {
      return "fault";
    }

    const limits =
      this.limits.get(id);

    if (!limits) {
      return "ok";
    }

    if (
      limits.faultLow !==
        undefined &&
      value <
        limits.faultLow
    ) {
      return "fault";
    }

    if (
      limits.faultHigh !==
        undefined &&
      value >
        limits.faultHigh
    ) {
      return "fault";
    }

    if (
      limits.warningLow !==
        undefined &&
      value <
        limits.warningLow
    ) {
      return "warning";
    }

    if (
      limits.warningHigh !==
        undefined &&
      value >
        limits.warningHigh
    ) {
      return "warning";
    }

    return "ok";
  }
}