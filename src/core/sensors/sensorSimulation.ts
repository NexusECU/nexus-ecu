import {
  SensorManager,
} from "./sensorManager";

export function registerDefaultSensors(
  sensors: SensorManager,
): void {
  sensors.registerSensor(
    {
      id: "rpm",
      name: "Engine RPM",
      unit: "rpm",
      minimum: 0,
      maximum: 12000,
      defaultValue: 0,
      critical: true,
    },
    {
      warningHigh: 8500,
      faultHigh: 11000,
    },
  );

  sensors.registerSensor(
    {
      id: "tps",
      name: "Throttle Position",
      unit: "%",
      minimum: 0,
      maximum: 100,
      defaultValue: 0,
      critical: true,
    },
  );

  sensors.registerSensor(
    {
      id: "map",
      name: "Manifold Pressure",
      unit: "kPa",
      minimum: 10,
      maximum: 400,
      defaultValue: 30,
      critical: true,
    },
    {
      warningHigh: 250,
      faultHigh: 350,
    },
  );

  sensors.registerSensor(
    {
      id: "maf",
      name: "Mass Air Flow",
      unit: "g/s",
      minimum: 0,
      maximum: 2000,
      defaultValue: 0,
      critical: false,
    },
  );

  sensors.registerSensor(
    {
      id: "iat",
      name: "Intake Air Temperature",
      unit: "°C",
      minimum: -40,
      maximum: 150,
      defaultValue: 25,
      critical: true,
    },
    {
      warningHigh: 60,
      faultHigh: 120,
    },
  );

  sensors.registerSensor(
    {
      id: "ect",
      name: "Engine Coolant Temperature",
      unit: "°C",
      minimum: -40,
      maximum: 150,
      defaultValue: 25,
      critical: true,
    },
    {
      warningHigh: 105,
      faultHigh: 120,
    },
  );

  sensors.registerSensor(
    {
      id: "lambda",
      name: "Lambda",
      unit: "λ",
      minimum: 0.5,
      maximum: 2,
      defaultValue: 1,
      critical: true,
    },
  );

  sensors.registerSensor(
    {
      id: "oil-pressure",
      name: "Oil Pressure",
      unit: "kPa",
      minimum: 0,
      maximum: 1000,
      defaultValue: 0,
      critical: true,
    },
    {
      warningLow: 100,
      faultLow: 50,
    },
  );

  sensors.registerSensor(
    {
      id: "fuel-pressure",
      name: "Fuel Pressure",
      unit: "kPa",
      minimum: 0,
      maximum: 2000,
      defaultValue: 350,
      critical: true,
    },
    {
      warningLow: 250,
      faultLow: 150,
    },
  );

  sensors.registerSensor(
    {
      id: "battery",
      name: "Battery Voltage",
      unit: "V",
      minimum: 8,
      maximum: 18,
      defaultValue: 12.6,
      critical: true,
    },
    {
      warningLow: 11.5,
      faultLow: 10,
    },
  );

  sensors.registerSensor(
    {
      id: "vehicle-speed",
      name: "Vehicle Speed",
      unit: "km/h",
      minimum: 0,
      maximum: 500,
      defaultValue: 0,
      critical: false,
    },
  );

  sensors.registerSensor(
    {
      id: "knock",
      name: "Knock Level",
      unit: "%",
      minimum: 0,
      maximum: 100,
      defaultValue: 0,
      critical: true,
    },
    {
      warningHigh: 20,
      faultHigh: 60,
    },
  );

  sensors.registerSensor(
    {
      id: "fuel-level",
      name: "Fuel Level",
      unit: "%",
      minimum: 0,
      maximum: 100,
      defaultValue: 100,
      critical: false,
    },
    {
      warningLow: 15,
      faultLow: 2,
    },
  );
}