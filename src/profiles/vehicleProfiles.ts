import type {
  EngineConfiguration,
  VehicleMode,
} from "../types/ecu";

export interface VehicleProfile {
  id: string;
  name: string;
  description: string;

  mode: VehicleMode;

  engine: EngineConfiguration;

  features: {
    tractionControl: boolean;
    launchControl: boolean;
    flatShift: boolean;
    antiLag: boolean;
    boostControl: boolean;
    flexFuel: boolean;
    idleControl: boolean;
    coolingControl: boolean;
  };
}

export const vehicleProfiles: VehicleProfile[] = [
  {
    id: "street-turbo-4",
    name: "Street Turbo 4",
    description:
      "Balanced turbocharged four-cylinder street setup.",

    mode: "street",

    engine: {
      cylinders: 4,
      displacementLitres: 2.0,
      fuelType: "petrol",
      aspiration: "turbocharged",

      redlineRpm: 7500,
      idleRpm: 800,

      injectorFlowCc: 550,
      fuelPressureKpa: 350,

      baseIgnitionTiming: 10,
    },

    features: {
      tractionControl: true,
      launchControl: true,
      flatShift: false,
      antiLag: false,
      boostControl: true,
      flexFuel: false,
      idleControl: true,
      coolingControl: true,
    },
  },

  {
    id: "drift-turbo-6",
    name: "Drift Turbo 6",
    description:
      "High-response turbocharged six-cylinder drift configuration.",

    mode: "drift",

    engine: {
      cylinders: 6,
      displacementLitres: 3.0,
      fuelType: "petrol",
      aspiration: "turbocharged",

      redlineRpm: 8000,
      idleRpm: 950,

      injectorFlowCc: 1000,
      fuelPressureKpa: 400,

      baseIgnitionTiming: 12,
    },

    features: {
      tractionControl: false,
      launchControl: true,
      flatShift: true,
      antiLag: true,
      boostControl: true,
      flexFuel: true,
      idleControl: true,
      coolingControl: true,
    },
  },

  {
    id: "drag-turbo-v8",
    name: "Drag Turbo V8",
    description:
      "High-power turbocharged V8 drag configuration.",

    mode: "drag",

    engine: {
      cylinders: 8,
      displacementLitres: 5.0,
      fuelType: "ethanol",
      aspiration: "twin-turbo",

      redlineRpm: 8500,
      idleRpm: 1100,

      injectorFlowCc: 1700,
      fuelPressureKpa: 450,

      baseIgnitionTiming: 8,
    },

    features: {
      tractionControl: true,
      launchControl: true,
      flatShift: true,
      antiLag: false,
      boostControl: true,
      flexFuel: true,
      idleControl: true,
      coolingControl: true,
    },
  },

  {
    id: "circuit-na-v8",
    name: "Circuit NA V8",
    description:
      "Naturally aspirated V8 circuit configuration.",

    mode: "circuit",

    engine: {
      cylinders: 8,
      displacementLitres: 4.5,
      fuelType: "petrol",
      aspiration:
        "naturally-aspirated",

      redlineRpm: 9000,
      idleRpm: 1100,

      injectorFlowCc: 700,
      fuelPressureKpa: 350,

      baseIgnitionTiming: 14,
    },

    features: {
      tractionControl: true,
      launchControl: true,
      flatShift: true,
      antiLag: false,
      boostControl: false,
      flexFuel: false,
      idleControl: true,
      coolingControl: true,
    },
  },

  {
    id: "rally-turbo-4",
    name: "Rally Turbo 4",
    description:
      "Turbocharged four-cylinder rally configuration.",

    mode: "rally",

    engine: {
      cylinders: 4,
      displacementLitres: 2.0,
      fuelType: "petrol",
      aspiration: "turbocharged",

      redlineRpm: 7500,
      idleRpm: 1000,

      injectorFlowCc: 850,
      fuelPressureKpa: 380,

      baseIgnitionTiming: 9,
    },

    features: {
      tractionControl: true,
      launchControl: true,
      flatShift: true,
      antiLag: true,
      boostControl: true,
      flexFuel: true,
      idleControl: true,
      coolingControl: true,
    },
  },

  {
    id: "offroad-diesel",
    name: "Off-Road Diesel",
    description:
      "Low-RPM turbo diesel configuration for specialist off-road vehicles.",

    mode: "off-road",

    engine: {
      cylinders: 6,
      displacementLitres: 3.0,
      fuelType: "diesel",
      aspiration: "turbocharged",

      redlineRpm: 5000,
      idleRpm: 750,

      injectorFlowCc: 900,
      fuelPressureKpa: 1200,

      baseIgnitionTiming: 0,
    },

    features: {
      tractionControl: true,
      launchControl: false,
      flatShift: false,
      antiLag: false,
      boostControl: true,
      flexFuel: false,
      idleControl: true,
      coolingControl: true,
    },
  },
];