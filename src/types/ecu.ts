export type VehicleMode =
  | "street"
  | "sport"
  | "race"
  | "drift"
  | "drag"
  | "circuit"
  | "rally"
  | "off-road"
  | "custom"
  | "test";

export type EcuMode = VehicleMode;

export type FuelType =
  | "petrol"
  | "diesel"
  | "e85"
  | "ethanol"
  | "methanol"
  | "other";

export type Aspiration =
  | "naturally-aspirated"
  | "turbocharged"
  | "supercharged"
  | "twin-turbo";

export interface EngineConfiguration {
  cylinders: number;

  displacementLitres: number;

  aspiration: Aspiration;

  redlineRpm: number;

  idleRpm?: number;

  fuelType: FuelType;

  compressionRatio?: number;

  maxBoostKpa?: number;

  injectorFlowCc: number;

  fuelPressureKpa: number;

  baseIgnitionTiming: number;
}

export interface SensorData {
  rpm: number;

  throttlePosition: number;

  manifoldPressureKpa: number;

  intakeAirTemperatureC: number;

  coolantTemperatureC: number;

  airFuelRatio: number;

  oilPressureKpa: number;

  batteryVoltage: number;

  vehicleSpeedKph: number;

  engineLoad: number;
}

export interface EcuSensors
  extends SensorData {}

export interface EcuOutputs {
  injectorPulseWidthMs: number;

  ignitionTimingDegrees: number;

  fuelPumpDuty: number;

  coolingFanDuty: number;

  boostControlDuty: number;
}

export interface LambdaControlState {
  active: boolean;

  targetAfr: number;

  measuredAfr: number;

  errorAfr: number;

  fuelTrimPercent: number;
}

export interface LimiterState {
  active: boolean;

  softLimitActive: boolean;

  hardLimitActive: boolean;

  launchControlActive: boolean;

  fuelCut: boolean;

  ignitionRetardDegrees: number;

  rpmLimit: number;
}

export interface BoostProtectionState {
  active: boolean;

  warningActive: boolean;

  cutActive: boolean;

  boostKpa: number;

  boostBar: number;

  ignitionRetardDegrees: number;

  fuelCut: boolean;

  boostCut: boolean;
}

export interface KnockControlState {
  active: boolean;

  knockDetected: boolean;

  severeKnock: boolean;

  knockLevel: number;

  ignitionRetardDegrees: number;

  knockCount: number;
}

export type EngineProtectionLevel =
  | "normal"
  | "warning"
  | "limp"
  | "shutdown";

export interface EngineProtectionState {
  active: boolean;

  level: EngineProtectionLevel;

  reasons: string[];

  boostMultiplier: number;

  rpmLimitMultiplier: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  fuelCut: boolean;

  shutdownRequested: boolean;
}

export interface TractionControlState {
  active: boolean;

  severe: boolean;

  slipPercent: number;

  ignitionRetardDegrees: number;

  boostMultiplier: number;

  fuelCut: boolean;
}

export interface FlexFuelState {
  active: boolean;

  ethanolPercent: number;

  ethanolFraction: number;

  fuelMultiplier: number;

  ignitionAdvanceDegrees: number;

  boostMultiplier: number;

  estimatedStoichAfr: number;
}

export interface AntiLagState {
  enabled: boolean;

  active: boolean;

  thermalProtection: boolean;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  reason: string;
}

export interface NoLiftShiftState {
  enabled: boolean;

  armed: boolean;

  active: boolean;

  recovering: boolean;

  timerMs: number;

  ignitionRetardDegrees: number;

  fuelCut: boolean;

  boostHoldMultiplier: number;

  reason: string;
}

export interface PitLimiterState {
  enabled: boolean;

  active: boolean;

  hardCutActive: boolean;

  targetSpeedKph: number;

  speedErrorKph: number;

  ignitionRetardDegrees: number;

  boostMultiplier: number;

  fuelCut: boolean;

  reason: string;
}

export interface BoostByGearState {
  enabled: boolean;

  active: boolean;

  currentGear: number;

  multiplier: number;

  baseBoostControlDuty: number;

  limitedBoostControlDuty: number;

  reason: string;
}

export interface TransmissionState {
  enabled: boolean;

  currentGear: number;

  previousGear: number;

  shiftUpRequested: boolean;

  shiftDownRequested: boolean;

  shiftOccurred: boolean;

  elapsedSinceShiftMs: number;

  reason: string;
}

export interface TorqueManagementState {
  active: boolean;

  requestedTorquePercent: number;

  deliveredTorquePercent: number;

  throttleMultiplier: number;

  ignitionRetardDegrees: number;

  boostMultiplier: number;

  fuelCut: boolean;

  dominantReason: string;
}

export interface DriveModeTorqueState {
  torqueMultiplier: number;

  throttleAuthority: number;

  boostAllowance: number;

  ignitionBiasDegrees: number;

  launchBias: number;

  tractionBias: number;
}

export interface RollingLaunchState {
  enabled: boolean;

  armed: boolean;

  active: boolean;

  released: boolean;

  targetSpeedKph: number;

  speedErrorKph: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  torqueMultiplier: number;

  reason: string;
}

export interface BrakeBoostState {
  enabled: boolean;

  armed: boolean;

  active: boolean;

  released: boolean;

  thermalProtection: boolean;

  brakePosition: number;

  ignitionRetardDegrees: number;

  fuelEnrichmentPercent: number;

  boostHoldMultiplier: number;

  torqueMultiplier: number;

  reason: string;
}

export interface VirtualDynoState {
  active: boolean;

  torqueNm: number;

  powerKw: number;

  horsepower: number;

  boostBar: number;

  peakTorqueNm: number;

  peakHorsepower: number;
}

export type SimulatedSensorFault =
  | "map"
  | "tps"
  | "coolant"
  | "iat"
  | "wideband"
  | "oil-pressure"
  | "battery";

export interface SensorFaultState {
  active: boolean;

  activeFaults: SimulatedSensorFault[];

  dtcs: string[];

  limpModeRequested: boolean;

  boostMultiplier: number;

  torqueMultiplier: number;
}

export type DtcSeverity =
  | "info"
  | "warning"
  | "critical";

export interface DtcFreezeFrame {
  timestampMs: number;

  rpm: number;

  throttlePercent: number;

  engineLoadPercent: number;

  manifoldPressureKpa: number;

  coolantTemperatureC: number;

  intakeAirTemperatureC: number;

  airFuelRatio: number;

  oilPressureKpa: number;

  batteryVoltage: number;

  vehicleSpeedKph: number;
}

export interface DtcRecord {
  code: string;

  message: string;

  severity: DtcSeverity;

  current: boolean;

  pending: boolean;

  stored: boolean;

  occurrences: number;

  firstSeenMs: number;

  lastSeenMs: number;

  freezeFrame:
    DtcFreezeFrame;
}

export interface DiagnosticsState {
  milActive: boolean;

  current: DtcRecord[];

  pending: DtcRecord[];

  stored: DtcRecord[];

  all: DtcRecord[];
}

export interface ProtectionSettingsState {
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

export interface CanFrameState {
  id: string;

  name: string;

  dlc: number;

  data: number[];

  timestampMs: number;

  frequencyHz: number;
}

export interface CanBusState {
  enabled: boolean;

  status:
    | "offline"
    | "online"
    | "warning"
    | "bus-off";

  bitrateKbps: number;

  busLoadPercent: number;

  txFrames: number;

  rxFrames: number;

  errorCount: number;

  droppedFrames: number;

  lastFrameId: string;

  frames: CanFrameState[];
}

export interface SensorCalibrationState {
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

export type TestBenchScenarioId =
  | "idle-warmup"
  | "street-pull"
  | "wot-pull"
  | "launch-test"
  | "sensor-fault-test";

export interface TestBenchState {
  running: boolean;

  scenarioId:
    | TestBenchScenarioId
    | null;

  scenarioName: string;

  elapsedSeconds: number;

  durationSeconds: number;

  progressPercent: number;

  status: string;

  completedRuns: number;
}

export interface EcuState {
  engineRunning: boolean;

  mode: EcuMode;

  sensors: EcuSensors;

  outputs: EcuOutputs;

  lambdaControl: LambdaControlState;

  limiter: LimiterState;

  boostProtection: BoostProtectionState;

  knockControl: KnockControlState;

  engineProtection: EngineProtectionState;

  /*
   * Optional for this integration step so the
   * existing App.tsx continues to compile before
   * the Traction Control dashboard is added.
   */
  tractionControl?: TractionControlState;

  flexFuel: FlexFuelState;

  antiLag: AntiLagState;

  noLiftShift: NoLiftShiftState;

  pitLimiter: PitLimiterState;

  boostByGear: BoostByGearState;

  transmission: TransmissionState;

  torqueManagement: TorqueManagementState;

  driveModeTorque: DriveModeTorqueState;

  rollingLaunch: RollingLaunchState;

  brakeBoost: BrakeBoostState;

  virtualDyno: VirtualDynoState;

  sensorFaults: SensorFaultState;

  diagnostics: DiagnosticsState;

  protectionSettings: ProtectionSettingsState;

  canBus: CanBusState;

  sensorCalibration: SensorCalibrationState;

  testBench: TestBenchState;

  faults: string[];
}
