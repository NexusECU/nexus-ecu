import type {
  EcuMode,
  EcuState,
  SensorData,
} from "../types/ecu";

import {
  calculateEngineProtection,
} from "./protection/engineProtection";

import {
  calculateKnockControl,
} from "./knock/knockControl";

import {
  calculateTractionControl,
} from "./traction/tractionControl";

import {
  calculateFlexFuelCompensation,
} from "./fuel/flexFuel";

import {
  calculateAntiLag,
  defaultAntiLagConfig,
} from "./antilag/antiLag";

import {
  calculateNoLiftShift,
  defaultNoLiftShiftConfig,
} from "./shifting/noLiftShift";

import {
  calculatePitLimiter,
  defaultPitLimiterConfig,
} from "./limiters/pitLimiter";

import {
  calculateBoostByGear,
  defaultBoostByGearConfig,
} from "./boost/boostByGear";

import {
  calculateTransmission,
  defaultTransmissionConfig,
} from "./transmission/transmission";

import {
  calculateTorqueManagement,
} from "./torque/torqueManager";

import {
  driveModeTorqueMaps,
} from "./modes/driveModeTorqueMaps";

import {
  calculateRollingLaunch,
  defaultRollingLaunchConfig,
} from "./launch/rollingLaunch";

import {
  calculateBrakeBoost,
  defaultBrakeBoostConfig,
} from "./launch/brakeBoost";

import {
  calculateVirtualDyno,
} from "./dyno/virtualDyno";

import {
  calculateSensorFaults,
  type SimulatedSensorFault,
} from "./diagnostics/sensorFaultManager";

import {
  DtcManager,
} from "./diagnostics/dtcManager";

import {
  clampProtectionSettings,
  defaultProtectionSettings,
  type ProtectionSettings,
} from "./protection/protectionSettings";

import {
  CanBusSimulator,
} from "./comms/canBus";

import {
  applySensorCalibration,
  clampSensorCalibrationSettings,
  defaultSensorCalibrationSettings,
  type SensorCalibrationSettings,
} from "./sensors/sensorCalibration";

import {
  createInitialTestBenchState,
  getTestBenchScenario,
  type TestBenchScenarioId,
} from "./testing/testBench";

import type {
  VehicleProfile,
} from "../profiles/vehicleProfiles";

import type {
  EcuMap,
} from "../maps/mapTypes";

import {
  calculateEngine,
} from "./engine";

import {
  ecuModes,
} from "./modes/modeConfig";

import {
  calculateLambdaCorrection,
} from "./fuel/lambdaController";

import {
  calculateRevLimiter,
} from "./limiters/revLimiter";

import {
  calculateBoostProtection,
} from "./boost/boostProtection";

export class EcuController {
  private profile: VehicleProfile;

  private state: EcuState;

  private ethanolContentPercent =
    0;

  /*
   * Raw simulator commands/state.
   *
   * These are intentionally kept separate from
   * calibrated sensor values so calibration offsets
   * and scaling do not compound every update tick.
   */
  private requestedThrottlePosition =
    0;

  private rawManifoldPressureKpa =
    30;

  private rawCoolantTemperatureC =
    25;

  private rawVehicleSpeedKph =
    0;

  private testBenchElapsedSeconds =
    0;

  private testBenchCompletedRuns =
    0;

  private activeTestBenchScenario:
    TestBenchScenarioId | null =
      null;

  private antiLagEnabled =
    false;

  private noLiftShiftEnabled =
    false;

  private noLiftShiftRequested =
    false;

  private noLiftShiftElapsedMs =
    0;

  private pitLimiterEnabled =
    false;

  private pitLimiterTargetSpeedKph =
    60;

  private boostByGearEnabled =
    false;

  private currentGear =
    1;

  private transmissionEnabled =
    true;

  private transmissionElapsedSinceShiftMs =
    9999;

  private rollingLaunchEnabled =
    false;

  private rollingLaunchTargetSpeedKph =
    60;

  private rollingLaunchReleaseRequested =
    false;

  private brakeBoostEnabled =
    false;

  private brakeBoostReleaseRequested =
    false;

  private brakePosition =
    0;

  private boostByGearMultipliers:
    Record<number, number> = {
      ...defaultBoostByGearConfig.gearMultipliers,
    };

  private sensorCalibration:
    SensorCalibrationSettings = {
      ...defaultSensorCalibrationSettings,
    };

  private canBus =
    new CanBusSimulator();

  private protectionSettings:
    ProtectionSettings = {
      ...defaultProtectionSettings,
    };

  private dtcManager =
    new DtcManager();

  private activeSensorFaults:
    Set<SimulatedSensorFault> =
      new Set();

  private maps: {
    fuel: EcuMap | null;
    ignition: EcuMap | null;
    boost: EcuMap | null;
  };

  constructor(
    profile: VehicleProfile,
  ) {
    this.profile = profile;

    this.maps = {
      fuel: null,
      ignition: null,
      boost: null,
    };

    this.state = {
      engineRunning: false,

      mode: "street",

      sensors: {
        rpm: 0,
        throttlePosition: 0,
        manifoldPressureKpa: 30,
        intakeAirTemperatureC: 25,
        coolantTemperatureC: 25,
        airFuelRatio: 14.7,
        oilPressureKpa: 0,
        batteryVoltage: 12.6,
        vehicleSpeedKph: 0,
        engineLoad: 0,
      },

      outputs: {
        injectorPulseWidthMs: 0,
        ignitionTimingDegrees: 0,
        fuelPumpDuty: 0,
        coolingFanDuty: 0,
        boostControlDuty: 0,
      },

      lambdaControl: {
        active: false,
        targetAfr: 14.7,
        measuredAfr: 14.7,
        errorAfr: 0,
        fuelTrimPercent: 0,
      },

      limiter: {
        active: false,
        softLimitActive: false,
        hardLimitActive: false,
        launchControlActive: false,
        fuelCut: false,
        ignitionRetardDegrees: 0,
        rpmLimit:
          profile.engine.redlineRpm,
      },

      boostProtection: {
        active: false,
        warningActive: false,
        cutActive: false,
        boostKpa: 0,
        boostBar: 0,
        ignitionRetardDegrees: 0,
        fuelCut: false,
        boostCut: false,
      },

      knockControl: {
        active: false,
        knockDetected: false,
        severeKnock: false,
        knockLevel: 0,
        ignitionRetardDegrees: 0,
        knockCount: 0,
      },

      engineProtection: {
        active: false,
        level: "normal",
        reasons: [],
        boostMultiplier: 1,
        rpmLimitMultiplier: 1,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        fuelCut: false,
        shutdownRequested: false,
      },

      tractionControl: {
        active: false,
        severe: false,
        slipPercent: 0,
        ignitionRetardDegrees: 0,
        boostMultiplier: 1,
        fuelCut: false,
      },

      flexFuel: {
        active: false,
        ethanolPercent: 0,
        ethanolFraction: 0,
        fuelMultiplier: 1,
        ignitionAdvanceDegrees: 0,
        boostMultiplier: 1,
        estimatedStoichAfr: 14.7,
      },

      antiLag: {
        enabled: false,
        active: false,
        thermalProtection: false,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        boostHoldMultiplier: 1,
        reason: "DISABLED",
      },

      noLiftShift: {
        enabled: false,
        armed: false,
        active: false,
        recovering: false,
        timerMs: 0,
        ignitionRetardDegrees: 0,
        fuelCut: false,
        boostHoldMultiplier: 1,
        reason: "DISABLED",
      },

      pitLimiter: {
        enabled: false,
        active: false,
        hardCutActive: false,
        targetSpeedKph: 60,
        speedErrorKph: 0,
        ignitionRetardDegrees: 0,
        boostMultiplier: 1,
        fuelCut: false,
        reason: "DISABLED",
      },

      boostByGear: {
        enabled: false,
        active: false,
        currentGear: 1,
        multiplier: 1,
        baseBoostControlDuty: 0,
        limitedBoostControlDuty: 0,
        reason: "DISABLED",
      },

      transmission: {
        enabled: true,
        currentGear: 1,
        previousGear: 1,
        shiftUpRequested: false,
        shiftDownRequested: false,
        shiftOccurred: false,
        elapsedSinceShiftMs: 9999,
        reason: "READY",
      },

      torqueManagement: {
        active: false,
        requestedTorquePercent: 0,
        deliveredTorquePercent: 0,
        throttleMultiplier: 1,
        ignitionRetardDegrees: 0,
        boostMultiplier: 1,
        fuelCut: false,
        dominantReason: "ENGINE OFF",
      },

      driveModeTorque: {
        torqueMultiplier:
          driveModeTorqueMaps.street
            .torqueMultiplier,
        throttleAuthority:
          driveModeTorqueMaps.street
            .throttleAuthority,
        boostAllowance:
          driveModeTorqueMaps.street
            .boostAllowance,
        ignitionBiasDegrees:
          driveModeTorqueMaps.street
            .ignitionBiasDegrees,
        launchBias:
          driveModeTorqueMaps.street
            .launchBias,
        tractionBias:
          driveModeTorqueMaps.street
            .tractionBias,
      },

      rollingLaunch: {
        enabled: false,
        armed: false,
        active: false,
        released: false,
        targetSpeedKph: 60,
        speedErrorKph: 0,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        boostHoldMultiplier: 1,
        torqueMultiplier: 1,
        reason: "DISABLED",
      },

      brakeBoost: {
        enabled: false,
        armed: false,
        active: false,
        released: false,
        thermalProtection: false,
        brakePosition: 0,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        boostHoldMultiplier: 1,
        torqueMultiplier: 1,
        reason: "DISABLED",
      },

      virtualDyno: {
        active: false,
        torqueNm: 0,
        powerKw: 0,
        horsepower: 0,
        boostBar: 0,
        peakTorqueNm: 0,
        peakHorsepower: 0,
      },

      sensorFaults: {
        active: false,
        activeFaults: [],
        dtcs: [],
        limpModeRequested: false,
        boostMultiplier: 1,
        torqueMultiplier: 1,
      },

      diagnostics: {
        milActive: false,
        current: [],
        pending: [],
        stored: [],
        all: [],
      },

      protectionSettings: {
        ...defaultProtectionSettings,
      },

      canBus: {
        enabled: true,
        status: "online",
        bitrateKbps: 500,
        busLoadPercent: 0,
        txFrames: 0,
        rxFrames: 0,
        errorCount: 0,
        droppedFrames: 0,
        lastFrameId: "—",
        frames: [],
      },

      sensorCalibration: {
        ...defaultSensorCalibrationSettings,
      },

      testBench: {
        ...createInitialTestBenchState(),
      },

      faults: [],
    };
  }

  startEngine(): void {
    this.state.engineRunning =
      true;

    const idleRpm =
      this.profile.engine
        .idleRpm ?? 850;

    if (
      this.state.sensors.rpm <
      idleRpm * 0.7
    ) {
      this.state.sensors.rpm =
        idleRpm;
    }

    this.rawManifoldPressureKpa =
      38;

    this.rawVehicleSpeedKph =
      0;
  }

  stopEngine(): void {
    this.state.engineRunning =
      false;

    this.requestedThrottlePosition =
      0;

    this.rawManifoldPressureKpa =
      30;

    this.rawVehicleSpeedKph =
      0;

    this.state.sensors.rpm = 0;
    this.state.sensors.throttlePosition = 0;
    this.state.sensors.engineLoad = 0;
    this.state.sensors.manifoldPressureKpa = 30;
    this.state.sensors.airFuelRatio = 14.7;
    this.state.sensors.oilPressureKpa = 0;
    this.state.sensors.vehicleSpeedKph = 0;
    this.state.sensors.batteryVoltage = 12.6;

    this.state.outputs = {
      injectorPulseWidthMs: 0,
      ignitionTimingDegrees: 0,
      fuelPumpDuty: 0,
      coolingFanDuty: 0,
      boostControlDuty: 0,
    };

    this.resetTransientControls();

    this.state.faults = [];
  }

  startTestBenchScenario(
    scenarioId:
      TestBenchScenarioId,
  ): void {
    const scenario =
      getTestBenchScenario(
        scenarioId,
      );

    if (!scenario) {
      return;
    }

    this.stopTestBenchScenario();

    this.activeTestBenchScenario =
      scenarioId;

    this.testBenchElapsedSeconds =
      0;

    this.state.testBench = {
      running: true,

      scenarioId,

      scenarioName:
        scenario.name,

      elapsedSeconds: 0,

      durationSeconds:
        scenario.durationSeconds,

      progressPercent: 0,

      status: "STARTING",

      completedRuns:
        this.testBenchCompletedRuns,
    };

    this.startEngine();
  }

  stopTestBenchScenario(): void {
    if (
      this.activeTestBenchScenario ===
      "sensor-fault-test"
    ) {
      this.setSensorFault(
        "map",
        false,
      );
    }

    this.activeTestBenchScenario =
      null;

    this.testBenchElapsedSeconds =
      0;

    this.requestedThrottlePosition =
      0;

    this.state.testBench = {
      ...this.state.testBench,

      running: false,

      scenarioId: null,

      elapsedSeconds: 0,

      progressPercent: 0,

      status: "READY",

      completedRuns:
        this.testBenchCompletedRuns,
    };
  }

  setThrottle(
    value: number,
  ): void {
    this.requestedThrottlePosition =
      Math.max(
        0,
        Math.min(
          100,
          value,
        ),
      );

    this.state.sensors.throttlePosition =
      this.requestedThrottlePosition;
  }

  setEthanolContent(
    value: number,
  ): void {
    this.ethanolContentPercent =
      Math.max(
        0,
        Math.min(
          85,
          value,
        ),
      );

    this.state.flexFuel =
      calculateFlexFuelCompensation(
        this.ethanolContentPercent,
      );
  }

  setAntiLagEnabled(
    enabled: boolean,
  ): void {
    this.antiLagEnabled =
      enabled;

    if (!enabled) {
      this.state.antiLag = {
        enabled: false,
        active: false,
        thermalProtection: false,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        boostHoldMultiplier: 1,
        reason: "DISABLED",
      };
    }
  }

  setNoLiftShiftEnabled(
    enabled: boolean,
  ): void {
    this.noLiftShiftEnabled =
      enabled;

    if (!enabled) {
      this.noLiftShiftRequested =
        false;

      this.noLiftShiftElapsedMs =
        0;

      this.state.noLiftShift = {
        enabled: false,
        armed: false,
        active: false,
        recovering: false,
        timerMs: 0,
        ignitionRetardDegrees: 0,
        fuelCut: false,
        boostHoldMultiplier: 1,
        reason: "DISABLED",
      };
    }
  }

  triggerNoLiftShift(): void {
    if (
      !this.noLiftShiftEnabled
    ) {
      return;
    }

    this.noLiftShiftRequested =
      true;

    this.noLiftShiftElapsedMs =
      0;
  }

  setPitLimiterEnabled(
    enabled: boolean,
  ): void {
    this.pitLimiterEnabled =
      enabled;

    if (!enabled) {
      this.state.pitLimiter = {
        enabled: false,
        active: false,
        hardCutActive: false,
        targetSpeedKph:
          this.pitLimiterTargetSpeedKph,
        speedErrorKph: 0,
        ignitionRetardDegrees: 0,
        boostMultiplier: 1,
        fuelCut: false,
        reason: "DISABLED",
      };
    }
  }

  setPitLimiterTargetSpeed(
    value: number,
  ): void {
    this.pitLimiterTargetSpeedKph =
      Math.max(
        20,
        Math.min(
          120,
          value,
        ),
      );

    this.state.pitLimiter.targetSpeedKph =
      this.pitLimiterTargetSpeedKph;
  }

  setBoostByGearEnabled(
    enabled: boolean,
  ): void {
    this.boostByGearEnabled =
      enabled;

    this.state.boostByGear.enabled =
      enabled;

    if (!enabled) {
      this.state.boostByGear = {
        enabled: false,
        active: false,
        currentGear:
          this.currentGear,
        multiplier: 1,
        baseBoostControlDuty:
          this.state.outputs
            .boostControlDuty,
        limitedBoostControlDuty:
          this.state.outputs
            .boostControlDuty,
        reason: "DISABLED",
      };
    }
  }

  setCurrentGear(
    gear: number,
  ): void {
    this.currentGear =
      Math.max(
        1,
        Math.min(
          6,
          Math.round(
            gear,
          ),
        ),
      );

    this.state.boostByGear.currentGear =
      this.currentGear;

    this.state.transmission.currentGear =
      this.currentGear;
  }

  setTransmissionEnabled(
    enabled: boolean,
  ): void {
    this.transmissionEnabled =
      enabled;

    this.state.transmission.enabled =
      enabled;
  }

  setRollingLaunchEnabled(
    enabled: boolean,
  ): void {
    this.rollingLaunchEnabled =
      enabled;

    this.rollingLaunchReleaseRequested =
      false;

    if (!enabled) {
      this.state.rollingLaunch = {
        enabled: false,
        armed: false,
        active: false,
        released: false,
        targetSpeedKph:
          this.rollingLaunchTargetSpeedKph,
        speedErrorKph: 0,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        boostHoldMultiplier: 1,
        torqueMultiplier: 1,
        reason: "DISABLED",
      };
    }
  }

  setRollingLaunchTargetSpeed(
    value: number,
  ): void {
    this.rollingLaunchTargetSpeedKph =
      Math.max(
        20,
        Math.min(
          200,
          value,
        ),
      );

    this.state.rollingLaunch.targetSpeedKph =
      this.rollingLaunchTargetSpeedKph;
  }

  releaseRollingLaunch(): void {
    if (
      !this.rollingLaunchEnabled
    ) {
      return;
    }

    this.rollingLaunchReleaseRequested =
      true;
  }

  setBrakeBoostEnabled(
    enabled: boolean,
  ): void {
    this.brakeBoostEnabled =
      enabled;

    this.brakeBoostReleaseRequested =
      false;

    if (!enabled) {
      this.state.brakeBoost = {
        enabled: false,
        armed: false,
        active: false,
        released: false,
        thermalProtection: false,
        brakePosition:
          this.brakePosition,
        ignitionRetardDegrees: 0,
        fuelEnrichmentPercent: 0,
        boostHoldMultiplier: 1,
        torqueMultiplier: 1,
        reason: "DISABLED",
      };
    }
  }

  setBrakePosition(
    value: number,
  ): void {
    this.brakePosition =
      Math.max(
        0,
        Math.min(
          100,
          value,
        ),
      );

    this.state.brakeBoost.brakePosition =
      this.brakePosition;
  }

  releaseBrakeBoost(): void {
    if (
      !this.brakeBoostEnabled
    ) {
      return;
    }

    this.brakeBoostReleaseRequested =
      true;
  }

  setBoostByGearMultiplier(
    gear: number,
    multiplier: number,
  ): void {
    const safeGear =
      Math.max(
        1,
        Math.min(
          6,
          Math.round(
            gear,
          ),
        ),
      );

    this.boostByGearMultipliers[
      safeGear
    ] =
      Math.max(
        0,
        Math.min(
          1.25,
          multiplier,
        ),
      );
  }

  setSensorFault(
    fault:
      SimulatedSensorFault,
    enabled: boolean,
  ): void {
    if (enabled) {
      this.activeSensorFaults.add(
        fault,
      );
    } else {
      this.activeSensorFaults.delete(
        fault,
      );
    }
  }

  clearSensorFaults(): void {
    this.activeSensorFaults.clear();

    this.state.sensorFaults = {
      active: false,
      activeFaults: [],
      dtcs: [],
      limpModeRequested: false,
      boostMultiplier: 1,
      torqueMultiplier: 1,
    };
  }

  setSensorCalibration(
    settings: SensorCalibrationSettings,
  ): void {
    this.sensorCalibration =
      clampSensorCalibrationSettings(
        settings,
      );

    this.state.sensorCalibration = {
      ...this.sensorCalibration,
    };

    this.state.testBench = {
      ...this.state.testBench,

      completedRuns:
        this.testBenchCompletedRuns,
    };
  }

  resetSensorCalibration(): void {
    this.sensorCalibration = {
      ...defaultSensorCalibrationSettings,
    };

    this.state.sensorCalibration = {
      ...this.sensorCalibration,
    };
  }

  setCanBusEnabled(
    enabled: boolean,
  ): void {
    this.canBus.setEnabled(
      enabled,
    );

    this.state.canBus =
      this.canBus.getState();

    this.state.sensorCalibration = {
      ...this.sensorCalibration,
    };
  }

  setCanBusBitrate(
    bitrateKbps: number,
  ): void {
    this.canBus.setBitrate(
      bitrateKbps,
    );

    this.state.canBus =
      this.canBus.getState();
  }

  clearCanBus(): void {
    this.canBus.clear();

    this.state.canBus =
      this.canBus.getState();
  }

  setProtectionSettings(
    settings: ProtectionSettings,
  ): void {
    this.protectionSettings =
      clampProtectionSettings(
        settings,
      );

    this.state.protectionSettings = {
      ...this.protectionSettings,
    };

    this.state.canBus =
      this.canBus.getState();
  }

  resetProtectionSettings(): void {
    this.protectionSettings = {
      ...defaultProtectionSettings,
    };

    this.state.protectionSettings = {
      ...this.protectionSettings,
    };
  }

  clearDtcs(): void {
    this.dtcManager.clear();

    this.state.diagnostics =
      this.dtcManager.getState();

    this.state.protectionSettings = {
      ...this.protectionSettings,
    };
  }

  setMode(
    mode: EcuMode,
  ): void {
    if (!ecuModes[mode]) {
      return;
    }

    this.state.mode = mode;

    const torqueMap =
      driveModeTorqueMaps[mode];

    this.state.driveModeTorque = {
      torqueMultiplier:
        torqueMap
          .torqueMultiplier,

      throttleAuthority:
        torqueMap
          .throttleAuthority,

      boostAllowance:
        torqueMap
          .boostAllowance,

      ignitionBiasDegrees:
        torqueMap
          .ignitionBiasDegrees,

      launchBias:
        torqueMap
          .launchBias,

      tractionBias:
        torqueMap
          .tractionBias,
    };
  }

  getMode(): EcuMode {
    return this.state.mode;
  }

  setProfile(
    profile: VehicleProfile,
  ): void {
    this.profile = profile;

    this.state.limiter.rpmLimit =
      profile.engine.redlineRpm;

    this.state.sensors.rpm =
      Math.min(
        this.state.sensors.rpm,
        profile.engine.redlineRpm,
      );

    this.rawManifoldPressureKpa =
      Math.max(
        25,
        Math.min(
          450,
          this.rawManifoldPressureKpa,
        ),
      );
  }

  getProfile(): VehicleProfile {
    return this.profile;
  }

  setMap(
    map: EcuMap,
  ): void {
    const mapType =
      this.getMapType(map);

    this.maps[mapType] = map;
  }

  getMap(
    type:
      | "fuel"
      | "ignition"
      | "boost",
  ): EcuMap | null {
    return this.maps[type];
  }

  getState(): EcuState {
    return {
      ...this.state,

      sensors: {
        ...this.state.sensors,
      },

      outputs: {
        ...this.state.outputs,
      },

      lambdaControl: {
        ...this.state.lambdaControl,
      },

      limiter: {
        ...this.state.limiter,
      },

      boostProtection: {
        ...this.state.boostProtection,
      },

      knockControl: {
        ...this.state.knockControl,
      },

      engineProtection: {
        ...this.state.engineProtection,
        reasons: [
          ...this.state.engineProtection.reasons,
        ],
      },

      tractionControl:
        this.state.tractionControl
          ? {
              ...this.state.tractionControl,
            }
          : undefined,

      flexFuel: {
        ...this.state.flexFuel,
      },

      antiLag: {
        ...this.state.antiLag,
      },

      noLiftShift: {
        ...this.state.noLiftShift,
      },

      pitLimiter: {
        ...this.state.pitLimiter,
      },

      boostByGear: {
        ...this.state.boostByGear,
      },

      transmission: {
        ...this.state.transmission,
      },

      torqueManagement: {
        ...this.state.torqueManagement,
      },

      driveModeTorque: {
        ...this.state.driveModeTorque,
      },

      rollingLaunch: {
        ...this.state.rollingLaunch,
      },

      brakeBoost: {
        ...this.state.brakeBoost,
      },

      virtualDyno: {
        ...this.state.virtualDyno,
      },

      sensorFaults: {
        ...this.state.sensorFaults,

        activeFaults: [
          ...this.state.sensorFaults
            .activeFaults,
        ],

        dtcs: [
          ...this.state.sensorFaults
            .dtcs,
        ],
      },

      diagnostics: {
        ...this.state.diagnostics,

        current:
          this.state.diagnostics.current.map(
            (record) => ({
              ...record,

              freezeFrame: {
                ...record.freezeFrame,
              },
            }),
          ),

        pending:
          this.state.diagnostics.pending.map(
            (record) => ({
              ...record,

              freezeFrame: {
                ...record.freezeFrame,
              },
            }),
          ),

        stored:
          this.state.diagnostics.stored.map(
            (record) => ({
              ...record,

              freezeFrame: {
                ...record.freezeFrame,
              },
            }),
          ),

        all:
          this.state.diagnostics.all.map(
            (record) => ({
              ...record,

              freezeFrame: {
                ...record.freezeFrame,
              },
            }),
          ),
      },

      protectionSettings: {
        ...this.state.protectionSettings,
      },

      canBus: {
        ...this.state.canBus,

        frames:
          this.state.canBus.frames.map(
            (frame) => ({
              ...frame,

              data: [
                ...frame.data,
              ],
            }),
          ),
      },

      sensorCalibration: {
        ...this.state.sensorCalibration,
      },

      faults: [
        ...this.state.faults,
      ],
    };
  }

  update(
    deltaTime: number,
  ): EcuState {
    /*
     * Protect the simulation from browser stalls or
     * unusually large frame/update intervals.
     */
    const safeDeltaTime =
      Math.max(
        0.005,
        Math.min(
          0.1,
          deltaTime,
        ),
      );

    this.runTestBenchScenario(
      safeDeltaTime,
    );

    if (
      !this.state.engineRunning
    ) {
      const ambientTemperature =
        25;

      const coolant =
        this.state.sensors
          .coolantTemperatureC;

      this.state.sensors
        .coolantTemperatureC =
        coolant +
        (ambientTemperature -
          coolant) *
          Math.min(
            1,
            safeDeltaTime *
              0.08,
          );

      this.requestedThrottlePosition =
        0;

      this.rawManifoldPressureKpa =
        30;

      this.rawVehicleSpeedKph =
        0;

      this.rawCoolantTemperatureC =
        this.state.sensors
          .coolantTemperatureC;

      this.state.sensors.rpm = 0;
      this.state.sensors.throttlePosition = 0;
      this.state.sensors.engineLoad = 0;
      this.state.sensors.manifoldPressureKpa = 30;
      this.state.sensors.intakeAirTemperatureC =
        ambientTemperature;
      this.state.sensors.airFuelRatio = 14.7;
      this.state.sensors.oilPressureKpa = 0;
      this.state.sensors.vehicleSpeedKph = 0;
      this.state.sensors.batteryVoltage = 12.6;

      this.state.outputs = {
        injectorPulseWidthMs: 0,
        ignitionTimingDegrees: 0,
        fuelPumpDuty: 0,
        coolingFanDuty: 0,
        boostControlDuty: 0,
      };

      this.resetTransientControls();

      this.state.faults = [];

      return this.getState();
    }

    /*
     * Restore the raw pedal command before running
     * control calculations. The displayed TPS may be
     * calibrated later in the update.
     */
    this.state.sensors
      .throttlePosition =
      this.requestedThrottlePosition;

    const mode =
      ecuModes[
        this.state.mode
      ];

    const effectiveThrottle =
      Math.max(
        0,
        Math.min(
          100,
          this.state.sensors
            .throttlePosition *
            mode.throttleResponse,
        ),
      );

    const currentRpm =
      this.state.sensors.rpm;

    const normalMaxRpm =
      this.profile.engine
        .redlineRpm *
      mode.maxRpmMultiplier *
      this.protectionSettings
        .maximumRevMultiplier;

    const idleRpm =
      this.profile.engine
        .idleRpm ?? 850;

    const preliminaryLimiter =
      calculateRevLimiter({
        engineRunning:
          this.state.engineRunning,

        rpm:
          currentRpm,

        redlineRpm:
          normalMaxRpm,

        throttlePosition:
          this.state.sensors
            .throttlePosition,

        vehicleSpeedKph:
          this.state.sensors
            .vehicleSpeedKph,
      });

    const activeRpmLimit =
      preliminaryLimiter.rpmLimit;

    const targetRpm =
      idleRpm +
      ((activeRpmLimit -
        idleRpm) *
        effectiveThrottle) /
        100;

    const rpmDifference =
      targetRpm -
      currentRpm;

    const rpmResponse =
      (
        rpmDifference >= 0
          ? 2.35
          : 3.1
      ) *
      mode.rpmResponse;

    const newRpm =
      currentRpm +
      rpmDifference *
        Math.min(
          1,
          rpmResponse *
            safeDeltaTime,
        );

    this.state.sensors.rpm =
      Math.max(
        0,
        Math.min(
          activeRpmLimit,
          newRpm,
        ),
      );

    const throttleLoad =
      effectiveThrottle /
      100;

    const preliminaryLoad =
      Math.min(
        1,
        Math.max(
          0,
          throttleLoad,
        ),
      );

    const boostMapBar =
      this.getMapValue(
        this.maps.boost,
        this.state.sensors.rpm,
        preliminaryLoad *
          100,
      );

    const atmosphericPressure =
      101.3;

    const isBoosted =
      this.profile.engine
        .aspiration !==
      "naturally-aspirated";

    let manifoldPressure =
      atmosphericPressure;

    if (isBoosted) {
      const targetBoostKpa =
        Math.max(
          0,
          boostMapBar,
        ) *
        100;

      const requestedBoost =
        targetBoostKpa *
        throttleLoad *
        mode.boostMultiplier;

      manifoldPressure =
        atmosphericPressure +
        requestedBoost;
    } else {
      const vacuum =
        (100 -
          effectiveThrottle) *
        0.45;

      manifoldPressure =
        Math.max(
          25,
          atmosphericPressure -
            vacuum,
        );
    }

    manifoldPressure =
      Math.max(
        25,
        Math.min(
          450,
          manifoldPressure,
        ),
      );

    /*
     * Turbo/manifold dynamics.
     *
     * Boost now builds progressively rather than
     * appearing instantly with throttle input. Vacuum
     * response remains quicker than positive boost.
     */
    const pressureDifference =
      manifoldPressure -
      this.rawManifoldPressureKpa;

    const pressureResponse =
      pressureDifference > 0
        ? (
            isBoosted
              ? 3.2
              : 7
          )
        : 6.5;

    this.rawManifoldPressureKpa +=
      pressureDifference *
      Math.min(
        1,
        pressureResponse *
          safeDeltaTime,
      );

    manifoldPressure =
      Math.max(
        25,
        Math.min(
          450,
          this.rawManifoldPressureKpa,
        ),
      );

    this.state.sensors
      .manifoldPressureKpa =
      manifoldPressure;

    const boostProtection =
      calculateBoostProtection({
        engineRunning:
          this.state.engineRunning,

        manifoldPressureKpa:
          manifoldPressure,

        atmosphericPressureKpa:
          atmosphericPressure,

        warningBoostBar:
          this.protectionSettings
            .boostWarningBar,

        cutBoostBar:
          this.protectionSettings
            .boostCutBar,
      });

    this.state.boostProtection = {
      ...boostProtection,
    };

    const pressureLoad =
      Math.max(
        0,
        (
          manifoldPressure -
          30
        ) /
          170,
      );

    const mapLoad =
      Math.min(
        1,
        pressureLoad,
      );

    this.state.sensors
      .engineLoad =
      Math.min(
        1,
        Math.max(
          0.08,
          throttleLoad *
            0.58 +
          mapLoad *
            0.42,
        ),
      );

    const finalLoad =
      this.state.sensors
        .engineLoad *
      100;

    const finalFuelMapAfr =
      this.getMapValue(
        this.maps.fuel,
        this.state.sensors.rpm,
        finalLoad,
      );

    const finalIgnitionMapTiming =
      this.getMapValue(
        this.maps.ignition,
        this.state.sensors.rpm,
        finalLoad,
      );

    const finalBoostMapBar =
      this.getMapValue(
        this.maps.boost,
        this.state.sensors.rpm,
        finalLoad,
      );

    const sensorData: SensorData = {
      ...this.state.sensors,
    };

    const calculation =
      calculateEngine(
        this.profile.engine,
        sensorData,
      );

    const targetAfr =
      this.isValidMapValue(
        this.maps.fuel,
        finalFuelMapAfr,
      )
        ? finalFuelMapAfr
        : calculation.targetAfr;

    const mixtureBias =
      Math.sin(
        this.state.sensors.rpm /
          760,
      ) *
        0.09 +
      (this.state.sensors
        .engineLoad -
        0.5) *
        0.14;

    const measuredAfr =
      Math.max(
        10,
        Math.min(
          20,
          targetAfr +
            mixtureBias,
        ),
      );

    const lambdaCorrection =
      calculateLambdaCorrection({
        targetAfr,

        measuredAfr,

        rpm:
          this.state.sensors.rpm,

        coolantTemperatureC:
          this.state.sensors
            .coolantTemperatureC,

        throttlePosition:
          this.state.sensors
            .throttlePosition,

        engineRunning:
          this.state.engineRunning,
      });

    const afrCorrection =
      14.7 /
      Math.max(
        targetAfr,
        1,
      );

    const mapAdjustedInjector =
      calculation.outputs
        .injectorPulseWidthMs *
      afrCorrection *
      lambdaCorrection.multiplier;

    const mapIgnition =
      this.isValidMapValue(
        this.maps.ignition,
        finalIgnitionMapTiming,
      )
        ? finalIgnitionMapTiming
        : calculation.outputs
            .ignitionTimingDegrees;

    const boostTargetKpa =
      Math.max(
        0,
        finalBoostMapBar,
      ) *
      100;

    const actualBoostKpa =
      Math.max(
        0,
        manifoldPressure -
          atmosphericPressure,
      );

    const boostError =
      boostTargetKpa -
      actualBoostKpa;

    const boostControl =
      isBoosted
        ? Math.min(
            100,
            Math.max(
              0,
              50 +
                boostError *
                  0.5,
            ),
          )
        : 0;

    this.state.outputs = {
      injectorPulseWidthMs:
        Math.max(
          0,
          Math.min(
            20,
            mapAdjustedInjector *
              mode.fuelMultiplier,
          ),
        ),

      ignitionTimingDegrees:
        Math.max(
          0,
          Math.min(
            45,
            mapIgnition *
              mode.ignitionMultiplier,
          ),
        ),

      fuelPumpDuty:
        calculation.outputs
          .fuelPumpDuty,

      coolingFanDuty:
        calculation.outputs
          .coolingFanDuty,

      boostControlDuty:
        Math.max(
          0,
          Math.min(
            100,
            boostControl *
              mode.boostMultiplier,
          ),
        ),
    };

    this.state.sensors
      .airFuelRatio =
      measuredAfr;

    this.state.lambdaControl = {
      active:
        lambdaCorrection.active,

      targetAfr,

      measuredAfr,

      errorAfr:
        lambdaCorrection
          .errorAfr,

      fuelTrimPercent:
        lambdaCorrection
          .fuelTrimPercent,
    };

    /*
     * FLEX FUEL COMPENSATION
     */
    const flexFuel =
      calculateFlexFuelCompensation(
        this.ethanolContentPercent,
      );

    this.state.flexFuel = {
      ...flexFuel,
    };

    this.state.outputs
      .injectorPulseWidthMs =
      Math.max(
        0,
        Math.min(
          20,
          this.state.outputs
            .injectorPulseWidthMs *
            flexFuel
              .fuelMultiplier,
        ),
      );

    this.state.outputs
      .ignitionTimingDegrees =
      Math.max(
        0,
        Math.min(
          45,
          this.state.outputs
            .ignitionTimingDegrees +
            flexFuel
              .ignitionAdvanceDegrees,
        ),
      );

    this.state.outputs
      .boostControlDuty =
      Math.max(
        0,
        Math.min(
          100,
          this.state.outputs
            .boostControlDuty *
            flexFuel
              .boostMultiplier,
        ),
      );

    /*
     * ANTI-LAG CONTROL
     */
    const antiLag =
      calculateAntiLag(
        {
          engineRunning:
            this.state.engineRunning,

          rpm:
            this.state.sensors.rpm,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          boostKpa:
            Math.max(
              0,
              this.state.sensors
                .manifoldPressureKpa -
                101.3,
            ),

          coolantTemperatureC:
            this.state.sensors
              .coolantTemperatureC,

          intakeAirTemperatureC:
            this.state.sensors
              .intakeAirTemperatureC,
        },
        {
          ...defaultAntiLagConfig,
          enabled:
            this.antiLagEnabled,
          maximumCoolantTemperatureC:
            this.protectionSettings
              .antiLagMaxCoolantC,
          maximumIntakeAirTemperatureC:
            this.protectionSettings
              .antiLagMaxIatC,
        },
      );

    this.state.antiLag = {
      ...antiLag,
    };

    if (
      antiLag.active
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            antiLag
              .ignitionRetardDegrees,
        );

      this.state.outputs
        .injectorPulseWidthMs =
        Math.min(
          20,
          this.state.outputs
            .injectorPulseWidthMs *
            (1 +
              antiLag
                .fuelEnrichmentPercent /
                100),
        );

      this.state.outputs
        .boostControlDuty =
        Math.max(
          0,
          Math.min(
            100,
            this.state.outputs
              .boostControlDuty *
              antiLag
                .boostHoldMultiplier,
          ),
        );
    }

    /*
     * NO-LIFT SHIFT
     */
    if (
      this.noLiftShiftRequested
    ) {
      this.noLiftShiftElapsedMs +=
        safeDeltaTime * 1000;
    }

    const noLiftShift =
      calculateNoLiftShift(
        {
          engineRunning:
            this.state.engineRunning,

          rpm:
            this.state.sensors.rpm,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,

          shiftRequested:
            this.noLiftShiftRequested,

          elapsedMs:
            this.noLiftShiftElapsedMs,
        },
        {
          ...defaultNoLiftShiftConfig,
          enabled:
            this.noLiftShiftEnabled,
        },
      );

    this.state.noLiftShift = {
      ...noLiftShift,
    };

    if (
      noLiftShift.active ||
      noLiftShift.recovering
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            noLiftShift
              .ignitionRetardDegrees,
        );

      this.state.outputs
        .boostControlDuty =
        Math.max(
          0,
          Math.min(
            100,
            this.state.outputs
              .boostControlDuty *
              noLiftShift
                .boostHoldMultiplier,
          ),
        );
    }

    if (
      noLiftShift.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;
    }

    if (
      this.noLiftShiftRequested &&
      this.noLiftShiftElapsedMs >
        defaultNoLiftShiftConfig
          .shiftWindowMs +
          defaultNoLiftShiftConfig
            .recoveryWindowMs
    ) {
      this.noLiftShiftRequested =
        false;

      this.noLiftShiftElapsedMs =
        0;
    }

    /*
     * PIT / SPEED LIMITER
     */
    const pitLimiter =
      calculatePitLimiter(
        {
          engineRunning:
            this.state.engineRunning,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          rpm:
            this.state.sensors.rpm,
        },
        {
          ...defaultPitLimiterConfig,
          enabled:
            this.pitLimiterEnabled,
          targetSpeedKph:
            this.pitLimiterTargetSpeedKph,
        },
      );

    this.state.pitLimiter = {
      ...pitLimiter,
    };

    if (
      pitLimiter.active
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            pitLimiter
              .ignitionRetardDegrees,
        );

      this.state.outputs
        .boostControlDuty =
        Math.max(
          0,
          Math.min(
            100,
            this.state.outputs
              .boostControlDuty *
              pitLimiter
                .boostMultiplier,
          ),
        );
    }

    if (
      pitLimiter.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;

      this.state.outputs
        .boostControlDuty =
        0;
    }

    /*
     * AUTOMATIC TRANSMISSION
     */
    this.transmissionElapsedSinceShiftMs +=
      safeDeltaTime * 1000;

    const transmission =
      calculateTransmission(
        {
          engineRunning:
            this.state.engineRunning,

          rpm:
            this.state.sensors.rpm,

          redlineRpm:
            normalMaxRpm,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          currentGear:
            this.currentGear,

          elapsedSinceShiftMs:
            this.transmissionElapsedSinceShiftMs,
        },
        {
          ...defaultTransmissionConfig,
          enabled:
            this.transmissionEnabled,
        },
      );

    if (
      transmission.shiftOccurred
    ) {
      this.currentGear =
        transmission.currentGear;

      this.transmissionElapsedSinceShiftMs =
        0;
    }

    this.state.transmission = {
      ...transmission,
      elapsedSinceShiftMs:
        this.transmissionElapsedSinceShiftMs,
    };

    /*
     * BOOST-BY-GEAR
     */
    const boostByGear =
      calculateBoostByGear(
        {
          engineRunning:
            this.state.engineRunning,

          currentGear:
            this.currentGear,

          baseBoostControlDuty:
            this.state.outputs
              .boostControlDuty,
        },
        {
          enabled:
            this.boostByGearEnabled,

          gearMultipliers: {
            ...this.boostByGearMultipliers,
          },
        },
      );

    this.state.boostByGear = {
      ...boostByGear,
    };

    this.state.outputs
      .boostControlDuty =
      boostByGear
        .limitedBoostControlDuty;

    /*
     * DRIVE MODE TORQUE MAP
     */
    const driveModeTorque =
      driveModeTorqueMaps[
        this.state.mode
      ];

    this.state.driveModeTorque = {
      torqueMultiplier:
        driveModeTorque
          .torqueMultiplier,

      throttleAuthority:
        driveModeTorque
          .throttleAuthority,

      boostAllowance:
        driveModeTorque
          .boostAllowance,

      ignitionBiasDegrees:
        driveModeTorque
          .ignitionBiasDegrees,

      launchBias:
        driveModeTorque
          .launchBias,

      tractionBias:
        driveModeTorque
          .tractionBias,
    };

    this.state.outputs
      .ignitionTimingDegrees =
      Math.max(
        0,
        Math.min(
          45,
          this.state.outputs
            .ignitionTimingDegrees +
            driveModeTorque
              .ignitionBiasDegrees,
        ),
      );

    /*
     * ROLLING LAUNCH
     */
    const rollingLaunch =
      calculateRollingLaunch(
        {
          engineRunning:
            this.state.engineRunning,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,

          rpm:
            this.state.sensors.rpm,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          boostKpa:
            Math.max(
              0,
              this.state.sensors
                .manifoldPressureKpa -
                101.3,
            ),

          releaseRequested:
            this.rollingLaunchReleaseRequested,
        },
        {
          ...defaultRollingLaunchConfig,
          enabled:
            this.rollingLaunchEnabled,
          targetSpeedKph:
            this.rollingLaunchTargetSpeedKph,
        },
      );

    this.state.rollingLaunch = {
      ...rollingLaunch,
    };

    if (
      rollingLaunch.active
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            rollingLaunch
              .ignitionRetardDegrees,
        );

      this.state.outputs
        .injectorPulseWidthMs =
        Math.min(
          20,
          this.state.outputs
            .injectorPulseWidthMs *
            (1 +
              rollingLaunch
                .fuelEnrichmentPercent /
                100),
        );

      this.state.outputs
        .boostControlDuty =
        Math.max(
          0,
          Math.min(
            100,
            this.state.outputs
              .boostControlDuty *
              rollingLaunch
                .boostHoldMultiplier,
          ),
        );
    }

    if (
      rollingLaunch.released
    ) {
      this.rollingLaunchReleaseRequested =
        false;

      this.rollingLaunchEnabled =
        false;
    }

    /*
     * BRAKE BOOST
     */
    const brakeBoost =
      calculateBrakeBoost(
        {
          engineRunning:
            this.state.engineRunning,

          rpm:
            this.state.sensors.rpm,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          brakePosition:
            this.brakePosition,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,

          coolantTemperatureC:
            this.state.sensors
              .coolantTemperatureC,

          intakeAirTemperatureC:
            this.state.sensors
              .intakeAirTemperatureC,

          releaseRequested:
            this.brakeBoostReleaseRequested,
        },
        {
          ...defaultBrakeBoostConfig,
          enabled:
            this.brakeBoostEnabled,
          maximumCoolantTemperatureC:
            this.protectionSettings
              .brakeBoostMaxCoolantC,
          maximumIntakeAirTemperatureC:
            this.protectionSettings
              .brakeBoostMaxIatC,
        },
      );

    this.state.brakeBoost = {
      ...brakeBoost,
    };

    if (
      brakeBoost.active
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            brakeBoost
              .ignitionRetardDegrees,
        );

      this.state.outputs
        .injectorPulseWidthMs =
        Math.min(
          20,
          this.state.outputs
            .injectorPulseWidthMs *
            (1 +
              brakeBoost
                .fuelEnrichmentPercent /
                100),
        );

      this.state.outputs
        .boostControlDuty =
        Math.max(
          0,
          Math.min(
            100,
            this.state.outputs
              .boostControlDuty *
              brakeBoost
                .boostHoldMultiplier,
          ),
        );
    }

    if (
      brakeBoost.released
    ) {
      this.brakeBoostReleaseRequested =
        false;

      this.brakeBoostEnabled =
        false;

      this.brakePosition =
        0;
    }

    /*
     * TORQUE MANAGEMENT
     */
    const torqueManagement =
      calculateTorqueManagement({
        engineRunning:
          this.state.engineRunning,

        throttlePosition:
          this.state.sensors
            .throttlePosition,

        engineLoad:
          this.state.sensors
            .engineLoad,

        tractionActive:
          this.state.tractionControl
            ?.active ?? false,

        tractionSevere:
          this.state.tractionControl
            ?.severe ?? false,

        transmissionShiftActive:
          this.state.transmission
            .shiftOccurred,

        launchControlActive:
          this.state.limiter
            .launchControlActive,

        pitLimiterActive:
          this.state.pitLimiter
            .active,

        pitLimiterHardCut:
          this.state.pitLimiter
            .hardCutActive,

        boostByGearMultiplier:
          this.state.boostByGear
            .multiplier,

        antiLagActive:
          this.state.antiLag
            .active,

        noLiftShiftActive:
          this.state.noLiftShift
            .active,

        noLiftShiftRecovering:
          this.state.noLiftShift
            .recovering,

        engineProtectionLevel:
          this.state.engineProtection
            .level,

        driveModeTorqueMultiplier:
          driveModeTorque
            .torqueMultiplier,

        driveModeThrottleAuthority:
          driveModeTorque
            .throttleAuthority,

        driveModeBoostAllowance:
          driveModeTorque
            .boostAllowance,

        driveModeTractionBias:
          driveModeTorque
            .tractionBias,

        rollingLaunchActive:
          rollingLaunch.active,

        rollingLaunchTorqueMultiplier:
          rollingLaunch
            .torqueMultiplier,

        brakeBoostActive:
          brakeBoost.active,

        brakeBoostTorqueMultiplier:
          brakeBoost
            .torqueMultiplier,

        sensorFaultActive:
          this.state.sensorFaults
            .active,

        sensorFaultLimpMode:
          this.state.sensorFaults
            .limpModeRequested,

        sensorFaultTorqueMultiplier:
          this.state.sensorFaults
            .torqueMultiplier,
      });

    this.state.torqueManagement = {
      ...torqueManagement,
    };

    this.state.outputs
      .ignitionTimingDegrees =
      Math.max(
        0,
        this.state.outputs
          .ignitionTimingDegrees -
          torqueManagement
            .ignitionRetardDegrees,
      );

    this.state.outputs
      .boostControlDuty =
      Math.max(
        0,
        Math.min(
          100,
          this.state.outputs
            .boostControlDuty *
            torqueManagement
              .boostMultiplier,
        ),
      );

    if (
      torqueManagement.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;

      this.state.outputs
        .boostControlDuty =
        0;
    }

    /*
     * BALANCED THERMAL / PRESSURE MODEL
     */
    const targetCoolant =
      88 +
      this.state.sensors
        .engineLoad *
        10 +
      Math.max(
        0,
        boostProtection
          .boostBar,
      ) *
        1.5;

    this.rawCoolantTemperatureC +=
      (
        targetCoolant -
        this.rawCoolantTemperatureC
      ) *
      Math.min(
        1,
        safeDeltaTime *
          0.16,
      );

    this.state.sensors
      .coolantTemperatureC =
      this.rawCoolantTemperatureC;

    this.state.sensors
      .intakeAirTemperatureC =
      25 +
      Math.max(
        0,
        manifoldPressure -
          atmosphericPressure,
      ) *
        0.065 +
      this.state.sensors
        .engineLoad *
        4;

    const oilPressureTarget =
      115 +
      this.state.sensors.rpm *
        0.055 +
      this.state.sensors
        .engineLoad *
        65;

    this.state.sensors
      .oilPressureKpa =
      Math.max(
        110,
        Math.min(
          650,
          oilPressureTarget,
        ),
      );

    this.state.sensors
      .batteryVoltage =
      this.state.sensors.rpm >
      500
        ? 13.9
        : 12.6;

    /*
     * BALANCED VEHICLE SPEED MODEL
     *
     * Gear changes now affect road speed and brake
     * input can hold the vehicle nearly stationary
     * while engine RPM/boost rises. This makes Brake
     * Boost and launch strategies testable.
     */
    const gearRatioFactor =
      0.008 +
      this.currentGear *
        0.0042;

    const freeRollingSpeedKph =
      Math.min(
        320,
        this.state.sensors.rpm *
          gearRatioFactor,
      );

    const brakeHold =
      Math.max(
        0,
        Math.min(
          1,
          this.brakePosition /
            100,
        ),
      );

    const targetVehicleSpeedKph =
      freeRollingSpeedKph *
      (
        1 -
        brakeHold *
          0.96
      );

    const speedResponse =
      targetVehicleSpeedKph >
      this.rawVehicleSpeedKph
        ? 1.8
        : 3;

    this.rawVehicleSpeedKph +=
      (
        targetVehicleSpeedKph -
        this.rawVehicleSpeedKph
      ) *
      Math.min(
        1,
        speedResponse *
          safeDeltaTime,
      );

    this.state.sensors
      .vehicleSpeedKph =
      Math.max(
        0,
        Math.min(
          320,
          this.rawVehicleSpeedKph,
        ),
      );

    const limiter =
      calculateRevLimiter({
        engineRunning:
          this.state.engineRunning,

        rpm:
          this.state.sensors.rpm,

        redlineRpm:
          normalMaxRpm,

        throttlePosition:
          this.state.sensors
            .throttlePosition,

        vehicleSpeedKph:
          this.state.sensors
            .vehicleSpeedKph,
      });

    this.state.limiter = {
      ...limiter,
    };

    if (
      limiter.softLimitActive
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            limiter
              .ignitionRetardDegrees,
        );
    }

    if (
      limiter.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;

      this.state.outputs
        .boostControlDuty =
        0;
    }

    if (
      this.state.sensors.rpm >
      limiter.rpmLimit
    ) {
      this.state.sensors.rpm =
        limiter.rpmLimit;
    }

    if (
      boostProtection.warningActive
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            boostProtection
              .ignitionRetardDegrees,
        );
    }

    if (
      boostProtection.boostCut
    ) {
      this.state.outputs
        .boostControlDuty =
        0;
    }

    if (
      boostProtection.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;
    }

    const previousKnockCount =
      this.state.knockControl
        .knockCount;

    const knockControl =
      calculateKnockControl({
        engineRunning:
          this.state.engineRunning,

        rpm:
          this.state.sensors.rpm,

        engineLoad:
          this.state.sensors
            .engineLoad,

        boostKpa:
          this.state.boostProtection
            .boostKpa,

        intakeAirTemperatureC:
          this.state.sensors
            .intakeAirTemperatureC,

        coolantTemperatureC:
          this.state.sensors
            .coolantTemperatureC,

        ignitionTimingDegrees:
          this.state.outputs
            .ignitionTimingDegrees,

        sensitivity:
          this.protectionSettings
            .knockSensitivity,
      });

    if (
      knockControl.knockDetected
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            knockControl
              .ignitionRetardDegrees,
        );
    }

    this.state.knockControl = {
      ...knockControl,

      knockCount:
        knockControl
          .knockDetected
          ? previousKnockCount +
            1
          : previousKnockCount,
    };

    if (
      knockControl.severeKnock
    ) {
      this.state.outputs
        .boostControlDuty = 0;
    }

    /*
     * TRACTION CONTROL
     */
    const tractionControl =
      calculateTractionControl({
        engineRunning:
          this.state.engineRunning,

        rpm:
          this.state.sensors.rpm,

        throttlePosition:
          this.state.sensors
            .throttlePosition,

        engineLoad:
          this.state.sensors
            .engineLoad,

        boostKpa:
          this.state.boostProtection
            .boostKpa,

        vehicleSpeedKph:
          this.state.sensors
            .vehicleSpeedKph,
      });

    this.state.tractionControl = {
      ...tractionControl,
    };

    if (
      tractionControl.active
    ) {
      this.state.outputs
        .ignitionTimingDegrees =
        Math.max(
          0,
          this.state.outputs
            .ignitionTimingDegrees -
            tractionControl
              .ignitionRetardDegrees,
        );

      this.state.outputs
        .boostControlDuty =
        Math.max(
          0,
          Math.min(
            100,
            this.state.outputs
              .boostControlDuty *
              tractionControl
                .boostMultiplier,
          ),
        );
    }

    if (
      tractionControl.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;

      this.state.outputs
        .boostControlDuty =
        0;
    }

    /*
     * ENGINE PROTECTION MANAGER
     */
    const engineProtection =
      calculateEngineProtection({
        engineRunning:
          this.state.engineRunning,

        rpm:
          this.state.sensors.rpm,

        redlineRpm:
          normalMaxRpm,

        coolantTemperatureC:
          this.state.sensors
            .coolantTemperatureC,

        oilPressureKpa:
          this.state.sensors
            .oilPressureKpa,

        airFuelRatio:
          this.state.sensors
            .airFuelRatio,

        targetAfr:
          this.state.lambdaControl
            .targetAfr,

        engineLoad:
          this.state.sensors
            .engineLoad,

        boostWarning:
          this.state.boostProtection
            .warningActive,

        overboostCut:
          this.state.boostProtection
            .cutActive,

        knockDetected:
          this.state.knockControl
            .knockDetected,

        severeKnock:
          this.state.knockControl
            .severeKnock,

        coolantWarningC:
          this.protectionSettings
            .coolantWarningC,

        coolantCriticalC:
          this.protectionSettings
            .coolantCriticalC,

        minimumOilPressureKpa:
          this.protectionSettings
            .minimumOilPressureKpa,

        lowOilPressureRpmThreshold:
          this.protectionSettings
            .lowOilPressureRpmThreshold,

        leanAfrLimit:
          this.protectionSettings
            .leanAfrLimit,

        richAfrLimit:
          this.protectionSettings
            .richAfrLimit,
      });

    this.state.engineProtection = {
      ...engineProtection,
    };

    this.state.outputs
      .boostControlDuty =
      Math.max(
        0,
        Math.min(
          100,
          this.state.outputs
            .boostControlDuty *
            engineProtection
              .boostMultiplier,
        ),
      );

    this.state.outputs
      .ignitionTimingDegrees =
      Math.max(
        0,
        this.state.outputs
          .ignitionTimingDegrees -
          engineProtection
            .ignitionRetardDegrees,
      );

    if (
      engineProtection
        .fuelEnrichmentPercent >
      0
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        Math.min(
          20,
          this.state.outputs
            .injectorPulseWidthMs *
            (1 +
              engineProtection
                .fuelEnrichmentPercent /
                100),
        );
    }

    if (
      engineProtection.fuelCut
    ) {
      this.state.outputs
        .injectorPulseWidthMs =
        0;

      this.state.outputs
        .boostControlDuty =
        0;
    }

    const protectionRpmLimit =
      normalMaxRpm *
      engineProtection
        .rpmLimitMultiplier;

    if (
      this.state.sensors.rpm >
      protectionRpmLimit
    ) {
      this.state.sensors.rpm =
        protectionRpmLimit;
    }

    if (
      engineProtection
        .shutdownRequested
    ) {
      this.state.engineRunning =
        false;

      this.state.outputs
        .injectorPulseWidthMs =
        0;

      this.state.outputs
        .ignitionTimingDegrees =
        0;

      this.state.outputs
        .boostControlDuty =
        0;

      this.state.outputs
        .fuelPumpDuty =
        0;
    }

    this.state.faults = [];

    for (
      const reason of
      engineProtection.reasons
    ) {
      if (
        !this.state.faults.includes(
          reason,
        )
      ) {
        this.state.faults.push(
          reason,
        );
      }
    }

    if (
      tractionControl.active
    ) {
      this.state.faults.push(
        tractionControl.severe
          ? "TRACTION CONTROL SEVERE"
          : "TRACTION CONTROL ACTIVE",
      );
    }

    if (
      this.state.antiLag
        .thermalProtection
    ) {
      this.state.faults.push(
        "ANTI-LAG THERMAL PROTECTION",
      );
    }

    if (
      this.state.noLiftShift.active
    ) {
      this.state.faults.push(
        "NO-LIFT SHIFT ACTIVE",
      );
    }

    if (
      this.state.pitLimiter
        .hardCutActive
    ) {
      this.state.faults.push(
        "PIT LIMITER HARD CUT",
      );
    }

    if (
      this.state.boostByGear.active
    ) {
      this.state.faults.push(
        "BOOST-BY-GEAR LIMITING",
      );
    }

    if (
      this.state.transmission
        .shiftOccurred
    ) {
      this.state.faults.push(
        this.state.transmission
          .shiftUpRequested
          ? "AUTOMATIC SHIFT UP"
          : "AUTOMATIC SHIFT DOWN",
      );
    }

    if (
      this.state.torqueManagement
        .active
    ) {
      this.state.faults.push(
        `TORQUE MANAGEMENT: ${this.state.torqueManagement.dominantReason}`,
      );
    }

    if (
      this.state.rollingLaunch.active
    ) {
      this.state.faults.push(
        "ROLLING LAUNCH ACTIVE",
      );
    }

    if (
      this.state.brakeBoost.active
    ) {
      this.state.faults.push(
        "BRAKE BOOST ACTIVE",
      );
    }

    if (
      this.state.brakeBoost
        .thermalProtection
    ) {
      this.state.faults.push(
        "BRAKE BOOST THERMAL PROTECTION",
      );
    }

    for (
      const dtc of
      this.state.sensorFaults.dtcs
    ) {
      if (
        !this.state.faults.includes(
          dtc,
        )
      ) {
        this.state.faults.push(
          dtc,
        );
      }
    }

    if (
      this.state.sensorFaults
        .limpModeRequested
    ) {
      this.state.faults.push(
        "SENSOR FAULT LIMP MODE",
      );
    }

    if (
      limiter.launchControlActive
    ) {
      this.state.faults.push(
        "LAUNCH CONTROL ACTIVE",
      );
    }

    if (
      limiter.hardLimitActive
    ) {
      this.state.faults.push(
        "REV LIMITER ACTIVE",
      );
    }

    if (
      boostProtection.warningActive &&
      !this.state.faults.includes(
        "BOOST WARNING",
      )
    ) {
      this.state.faults.push(
        "BOOST WARNING",
      );
    }

    if (
      boostProtection.cutActive &&
      !this.state.faults.includes(
        "OVERBOOST CUT",
      )
    ) {
      this.state.faults.push(
        "OVERBOOST CUT",
      );
    }

    if (
      knockControl.knockDetected &&
      !this.state.faults.includes(
        "KNOCK DETECTED",
      )
    ) {
      this.state.faults.push(
        "KNOCK DETECTED",
      );
    }

    if (
      knockControl.severeKnock &&
      !this.state.faults.includes(
        "SEVERE KNOCK",
      )
    ) {
      this.state.faults.push(
        "SEVERE KNOCK",
      );
    }

    if (
      this.state.sensors
        .coolantTemperatureC >=
      this.protectionSettings
        .coolantCriticalC &&
      !this.state.faults.includes(
        "HIGH COOLANT TEMPERATURE",
      )
    ) {
      this.state.faults.push(
        "HIGH COOLANT TEMPERATURE",
      );

      this.state.outputs
        .boostControlDuty = 0;
    }

    if (
      this.state.sensors
        .oilPressureKpa <
        this.protectionSettings
          .minimumOilPressureKpa &&
      this.state.sensors.rpm >
        this.protectionSettings
          .lowOilPressureRpmThreshold &&
      !this.state.faults.includes(
        "LOW OIL PRESSURE",
      )
    ) {
      this.state.faults.push(
        "LOW OIL PRESSURE",
      );
    }

    if (
      this.state.sensors
        .batteryVoltage <
      11
    ) {
      this.state.faults.push(
        "LOW BATTERY VOLTAGE",
      );
    }

    /*
     * SENSOR CALIBRATION
     */
    const calibratedSensors =
      applySensorCalibration(
        {
          throttlePosition:
            this.state.sensors
              .throttlePosition,

          manifoldPressureKpa:
            this.rawManifoldPressureKpa,

          airFuelRatio:
            this.state.sensors
              .airFuelRatio,

          coolantTemperatureC:
            this.rawCoolantTemperatureC,

          intakeAirTemperatureC:
            this.state.sensors
              .intakeAirTemperatureC,

          oilPressureKpa:
            this.state.sensors
              .oilPressureKpa,

          batteryVoltage:
            this.state.sensors
              .batteryVoltage,
        },

        this.sensorCalibration,
      );

    this.state.sensors
      .throttlePosition =
      calibratedSensors
        .throttlePosition;

    this.state.sensors
      .manifoldPressureKpa =
      calibratedSensors
        .manifoldPressureKpa;

    this.state.sensors
      .airFuelRatio =
      calibratedSensors
        .airFuelRatio;

    this.state.sensors
      .coolantTemperatureC =
      calibratedSensors
        .coolantTemperatureC;

    this.state.sensors
      .intakeAirTemperatureC =
      calibratedSensors
        .intakeAirTemperatureC;

    this.state.sensors
      .oilPressureKpa =
      calibratedSensors
        .oilPressureKpa;

    this.state.sensors
      .batteryVoltage =
      calibratedSensors
        .batteryVoltage;

    /*
     * SENSOR FAULT INJECTION
     */
    const sensorFaultResult =
      calculateSensorFaults({
        activeFaults: [
          ...this.activeSensorFaults,
        ],

        rpm:
          this.state.sensors.rpm,

        throttlePosition:
          this.state.sensors
            .throttlePosition,

        manifoldPressureKpa:
          this.state.sensors
            .manifoldPressureKpa,

        coolantTemperatureC:
          this.state.sensors
            .coolantTemperatureC,

        intakeAirTemperatureC:
          this.state.sensors
            .intakeAirTemperatureC,

        airFuelRatio:
          this.state.sensors
            .airFuelRatio,

        oilPressureKpa:
          this.state.sensors
            .oilPressureKpa,

        batteryVoltage:
          this.state.sensors
            .batteryVoltage,
      });

    this.state.sensorFaults = {
      active:
        sensorFaultResult.active,

      activeFaults: [
        ...sensorFaultResult
          .activeFaults,
      ],

      dtcs: [
        ...sensorFaultResult.dtcs,
      ],

      limpModeRequested:
        sensorFaultResult
          .limpModeRequested,

      boostMultiplier:
        sensorFaultResult
          .boostMultiplier,

      torqueMultiplier:
        sensorFaultResult
          .torqueMultiplier,
    };

    this.state.sensors
      .throttlePosition =
      sensorFaultResult
        .fallbackValues
        .throttlePosition;

    this.state.sensors
      .manifoldPressureKpa =
      sensorFaultResult
        .fallbackValues
        .manifoldPressureKpa;

    this.state.sensors
      .coolantTemperatureC =
      sensorFaultResult
        .fallbackValues
        .coolantTemperatureC;

    this.state.sensors
      .intakeAirTemperatureC =
      sensorFaultResult
        .fallbackValues
        .intakeAirTemperatureC;

    this.state.sensors
      .airFuelRatio =
      sensorFaultResult
        .fallbackValues
        .airFuelRatio;

    this.state.sensors
      .oilPressureKpa =
      sensorFaultResult
        .fallbackValues
        .oilPressureKpa;

    this.state.sensors
      .batteryVoltage =
      sensorFaultResult
        .fallbackValues
        .batteryVoltage;

    this.state.outputs
      .boostControlDuty =
      Math.max(
        0,
        Math.min(
          100,
          this.state.outputs
            .boostControlDuty *
            sensorFaultResult
              .boostMultiplier,
        ),
      );

    /*
     * VIRTUAL DYNO
     */
    const virtualDyno =
      calculateVirtualDyno({
        engineRunning:
          this.state.engineRunning,

        rpm:
          this.state.sensors.rpm,

        engineLoad:
          this.state.sensors
            .engineLoad,

        manifoldPressureKpa:
          this.state.sensors
            .manifoldPressureKpa,

        displacementLitres:
          this.profile.engine
            .displacementLitres,

        cylinders:
          this.profile.engine
            .cylinders,

        aspiration:
          this.profile.engine
            .aspiration,
      });

    this.state.virtualDyno = {
      ...virtualDyno,

      peakTorqueNm:
        Math.max(
          this.state.virtualDyno
            .peakTorqueNm,
          virtualDyno.torqueNm,
        ),

      peakHorsepower:
        Math.max(
          this.state.virtualDyno
            .peakHorsepower,
          virtualDyno.horsepower,
        ),
    };

    /*
     * CAN / DATA BUS
     */
    this.state.canBus =
      this.canBus.update(
        {
          engineRunning:
            this.state.engineRunning,

          rpm:
            this.state.sensors.rpm,

          throttlePosition:
            this.state.sensors
              .throttlePosition,

          manifoldPressureKpa:
            this.state.sensors
              .manifoldPressureKpa,

          coolantTemperatureC:
            this.state.sensors
              .coolantTemperatureC,

          intakeAirTemperatureC:
            this.state.sensors
              .intakeAirTemperatureC,

          airFuelRatio:
            this.state.sensors
              .airFuelRatio,

          oilPressureKpa:
            this.state.sensors
              .oilPressureKpa,

          batteryVoltage:
            this.state.sensors
              .batteryVoltage,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,

          currentGear:
            this.state.transmission
              .currentGear,

          engineLoadPercent:
            this.state.sensors
              .engineLoad *
            100,
        },

        Date.now(),
      );

    /*
     * ADVANCED DTC MANAGER
     */
    const diagnosticFaults =
      [
        ...new Set([
          ...this.state.faults,

          ...this.state
            .sensorFaults.dtcs,
        ]),
      ];

    this.state.diagnostics =
      this.dtcManager.update(
        diagnosticFaults,

        {
          rpm:
            this.state.sensors.rpm,

          throttlePercent:
            this.state.sensors
              .throttlePosition,

          engineLoadPercent:
            this.state.sensors
              .engineLoad *
            100,

          manifoldPressureKpa:
            this.state.sensors
              .manifoldPressureKpa,

          coolantTemperatureC:
            this.state.sensors
              .coolantTemperatureC,

          intakeAirTemperatureC:
            this.state.sensors
              .intakeAirTemperatureC,

          airFuelRatio:
            this.state.sensors
              .airFuelRatio,

          oilPressureKpa:
            this.state.sensors
              .oilPressureKpa,

          batteryVoltage:
            this.state.sensors
              .batteryVoltage,

          vehicleSpeedKph:
            this.state.sensors
              .vehicleSpeedKph,
        },

        Date.now(),
      );

    return this.getState();
  }

  private runTestBenchScenario(
    deltaTime: number,
  ): void {
    if (
      !this.activeTestBenchScenario
    ) {
      return;
    }

    const scenario =
      getTestBenchScenario(
        this.activeTestBenchScenario,
      );

    if (!scenario) {
      this.stopTestBenchScenario();
      return;
    }

    this.testBenchElapsedSeconds +=
      deltaTime;

    const elapsed =
      this.testBenchElapsedSeconds;

    const duration =
      scenario.durationSeconds;

    const progress =
      Math.min(
        100,
        elapsed /
          duration *
          100,
      );

    let status =
      "RUNNING";

    switch (
      this.activeTestBenchScenario
    ) {
      case "idle-warmup": {
        this.state.mode =
          "street";

        this.requestedThrottlePosition =
          elapsed < 3
            ? 2
            : elapsed < 10
              ? 5
              : 2;

        status =
          elapsed < 3
            ? "STABILISING IDLE"
            : "WARM-UP";
        break;
      }

      case "street-pull": {
        this.state.mode =
          "street";

        const throttle =
          elapsed < 2
            ? 15
            : elapsed < 5
              ? 35
              : elapsed < 9
                ? 65
                : elapsed < 12
                  ? 85
                  : 20;

        this.requestedThrottlePosition =
          throttle;

        status =
          throttle >= 65
            ? "ACCELERATION"
            : "DRIVABILITY";
        break;
      }

      case "wot-pull": {
        this.state.mode =
          "sport";

        const ramp =
          Math.min(
            1,
            elapsed / 3,
          );

        this.requestedThrottlePosition =
          elapsed > 10
            ? 25
            : 30 +
              ramp *
                70;

        status =
          elapsed < 3
            ? "THROTTLE RAMP"
            : elapsed <= 10
              ? "FULL LOAD"
              : "COOLDOWN";
        break;
      }

      case "launch-test": {
        this.state.mode =
          "drag";

        this.requestedThrottlePosition =
          elapsed < 3.5
            ? 100
            : elapsed < 8
              ? 92
              : 30;

        status =
          elapsed < 3.5
            ? "LAUNCH BUILD"
            : elapsed < 8
              ? "ACCELERATION"
              : "COOLDOWN";
        break;
      }

      case "sensor-fault-test": {
        this.state.mode =
          "street";

        this.requestedThrottlePosition =
          28;

        if (
          elapsed >= 2 &&
          elapsed < 9
        ) {
          this.setSensorFault(
            "map",
            true,
          );

          status =
            "MAP FAULT ACTIVE";
        } else {
          this.setSensorFault(
            "map",
            false,
          );

          status =
            elapsed < 2
              ? "BASELINE"
              : "FAULT CLEARED";
        }
        break;
      }
    }

    this.state.testBench = {
      running: true,

      scenarioId:
        this.activeTestBenchScenario,

      scenarioName:
        scenario.name,

      elapsedSeconds:
        elapsed,

      durationSeconds:
        duration,

      progressPercent:
        progress,

      status,

      completedRuns:
        this.testBenchCompletedRuns,
    };

    if (
      elapsed >= duration
    ) {
      this.requestedThrottlePosition =
        0;

      if (
        this.activeTestBenchScenario ===
        "sensor-fault-test"
      ) {
        this.setSensorFault(
          "map",
          false,
        );
      }

      this.testBenchCompletedRuns +=
        1;

      this.activeTestBenchScenario =
        null;

      this.testBenchElapsedSeconds =
        0;

      this.state.testBench = {
        running: false,

        scenarioId: null,

        scenarioName:
          scenario.name,

        elapsedSeconds:
          duration,

        durationSeconds:
          duration,

        progressPercent:
          100,

        status: "COMPLETED",

        completedRuns:
          this.testBenchCompletedRuns,
      };
    }
  }

  private resetTransientControls(): void {
    if (
      !this.state.engineRunning
    ) {
      this.requestedThrottlePosition =
        0;

      this.rawManifoldPressureKpa =
        30;

      this.rawVehicleSpeedKph =
        0;

      this.rawCoolantTemperatureC =
        this.state.sensors
          .coolantTemperatureC;
    }

    this.state.lambdaControl = {
      active: false,
      targetAfr: 14.7,
      measuredAfr: 14.7,
      errorAfr: 0,
      fuelTrimPercent: 0,
    };

    this.state.limiter = {
      active: false,
      softLimitActive: false,
      hardLimitActive: false,
      launchControlActive: false,
      fuelCut: false,
      ignitionRetardDegrees: 0,
      rpmLimit:
        this.profile.engine.redlineRpm,
    };

    this.state.boostProtection = {
      active: false,
      warningActive: false,
      cutActive: false,
      boostKpa: 0,
      boostBar: 0,
      ignitionRetardDegrees: 0,
      fuelCut: false,
      boostCut: false,
    };

    this.state.knockControl = {
      active: false,
      knockDetected: false,
      severeKnock: false,
      knockLevel: 0,
      ignitionRetardDegrees: 0,
      knockCount:
        this.state.knockControl
          .knockCount,
    };

    this.state.engineProtection = {
      active: false,
      level: "normal",
      reasons: [],
      boostMultiplier: 1,
      rpmLimitMultiplier: 1,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      fuelCut: false,
      shutdownRequested: false,
    };

    this.state.tractionControl = {
      active: false,
      severe: false,
      slipPercent: 0,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
    };

    this.state.flexFuel =
      calculateFlexFuelCompensation(
        this.ethanolContentPercent,
      );

    this.state.antiLag = {
      enabled:
        this.antiLagEnabled,
      active: false,
      thermalProtection: false,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      reason:
        this.antiLagEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };

    this.noLiftShiftRequested =
      false;

    this.noLiftShiftElapsedMs =
      0;

    this.state.noLiftShift = {
      enabled:
        this.noLiftShiftEnabled,
      armed: false,
      active: false,
      recovering: false,
      timerMs: 0,
      ignitionRetardDegrees: 0,
      fuelCut: false,
      boostHoldMultiplier: 1,
      reason:
        this.noLiftShiftEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };

    this.state.pitLimiter = {
      enabled:
        this.pitLimiterEnabled,
      active: false,
      hardCutActive: false,
      targetSpeedKph:
        this.pitLimiterTargetSpeedKph,
      speedErrorKph: 0,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
      reason:
        this.pitLimiterEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };

    this.state.boostByGear = {
      enabled:
        this.boostByGearEnabled,
      active: false,
      currentGear:
        this.currentGear,
      multiplier:
        this.boostByGearMultipliers[
          this.currentGear
        ] ?? 1,
      baseBoostControlDuty: 0,
      limitedBoostControlDuty: 0,
      reason:
        this.boostByGearEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };

    this.transmissionElapsedSinceShiftMs =
      9999;

    this.state.transmission = {
      enabled:
        this.transmissionEnabled,
      currentGear:
        this.currentGear,
      previousGear:
        this.currentGear,
      shiftUpRequested: false,
      shiftDownRequested: false,
      shiftOccurred: false,
      elapsedSinceShiftMs:
        this.transmissionElapsedSinceShiftMs,
      reason:
        this.transmissionEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };

    this.state.torqueManagement = {
      active: false,
      requestedTorquePercent: 0,
      deliveredTorquePercent: 0,
      throttleMultiplier: 1,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
      dominantReason: "ENGINE OFF",
    };

    const driveModeTorque =
      driveModeTorqueMaps[
        this.state.mode
      ];

    this.state.driveModeTorque = {
      torqueMultiplier:
        driveModeTorque
          .torqueMultiplier,
      throttleAuthority:
        driveModeTorque
          .throttleAuthority,
      boostAllowance:
        driveModeTorque
          .boostAllowance,
      ignitionBiasDegrees:
        driveModeTorque
          .ignitionBiasDegrees,
      launchBias:
        driveModeTorque
          .launchBias,
      tractionBias:
        driveModeTorque
          .tractionBias,
    };

    this.rollingLaunchReleaseRequested =
      false;

    this.state.rollingLaunch = {
      enabled:
        this.rollingLaunchEnabled,
      armed: false,
      active: false,
      released: false,
      targetSpeedKph:
        this.rollingLaunchTargetSpeedKph,
      speedErrorKph: 0,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason:
        this.rollingLaunchEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };

    this.brakeBoostReleaseRequested =
      false;

    this.brakePosition =
      0;

    this.state.brakeBoost = {
      enabled:
        this.brakeBoostEnabled,
      armed: false,
      active: false,
      released: false,
      thermalProtection: false,
      brakePosition: 0,
      ignitionRetardDegrees: 0,
      fuelEnrichmentPercent: 0,
      boostHoldMultiplier: 1,
      torqueMultiplier: 1,
      reason:
        this.brakeBoostEnabled
          ? "ENGINE OFF"
          : "DISABLED",
    };
    this.state.sensorFaults = {
      active:
        this.activeSensorFaults
          .size > 0,
      activeFaults: [
        ...this.activeSensorFaults,
      ],
      dtcs: [],
      limpModeRequested: false,
      boostMultiplier: 1,
      torqueMultiplier: 1,
    };

    this.state.diagnostics =
      this.dtcManager.getState();

    this.state.virtualDyno = {
      active: false,
      torqueNm: 0,
      powerKw: 0,
      horsepower: 0,
      boostBar: 0,
      peakTorqueNm:
        this.state.virtualDyno
          .peakTorqueNm,
      peakHorsepower:
        this.state.virtualDyno
          .peakHorsepower,
    };
  }

  private getMapValue(
    map: EcuMap | null,
    rpm: number,
    loadPercent: number,
  ): number {
    if (!map) {
      return 0;
    }

    const xValues =
      map.xAxis.values;

    const yValues =
      map.yAxis.values;

    if (
      xValues.length === 0 ||
      yValues.length === 0 ||
      map.values.length === 0
    ) {
      return 0;
    }

    const clampedLoad =
      Math.max(
        xValues[0],
        Math.min(
          xValues[
            xValues.length - 1
          ],
          loadPercent,
        ),
      );

    const clampedRpm =
      Math.max(
        yValues[0],
        Math.min(
          yValues[
            yValues.length - 1
          ],
          rpm,
        ),
      );

    let x1 = 0;
    let x2 =
      xValues.length - 1;

    for (
      let i = 0;
      i <
      xValues.length - 1;
      i++
    ) {
      if (
        clampedLoad >=
          xValues[i] &&
        clampedLoad <=
          xValues[i + 1]
      ) {
        x1 = i;
        x2 = i + 1;
        break;
      }
    }

    let y1 = 0;
    let y2 =
      yValues.length - 1;

    for (
      let i = 0;
      i <
      yValues.length - 1;
      i++
    ) {
      if (
        clampedRpm >=
          yValues[i] &&
        clampedRpm <=
          yValues[i + 1]
      ) {
        y1 = i;
        y2 = i + 1;
        break;
      }
    }

    const q11 =
      map.values[y1]?.[x1] ??
      0;

    const q21 =
      map.values[y1]?.[x2] ??
      q11;

    const q12 =
      map.values[y2]?.[x1] ??
      q11;

    const q22 =
      map.values[y2]?.[x2] ??
      q21;

    const xRange =
      xValues[x2] -
      xValues[x1];

    const yRange =
      yValues[y2] -
      yValues[y1];

    const xFactor =
      xRange === 0
        ? 0
        : (clampedLoad -
            xValues[x1]) /
          xRange;

    const yFactor =
      yRange === 0
        ? 0
        : (clampedRpm -
            yValues[y1]) /
          yRange;

    const top =
      q11 +
      (q21 - q11) *
        xFactor;

    const bottom =
      q12 +
      (q22 - q12) *
        xFactor;

    const value =
      top +
      (bottom - top) *
        yFactor;

    return Math.max(
      map.minimum,
      Math.min(
        map.maximum,
        value,
      ),
    );
  }

  private isValidMapValue(
    map: EcuMap | null,
    value: number,
  ): boolean {
    if (!map) {
      return false;
    }

    return (
      Number.isFinite(value) &&
      value >= map.minimum &&
      value <= map.maximum
    );
  }

  private getMapType(
    map: EcuMap,
  ):
    | "fuel"
    | "ignition"
    | "boost" {
    if (
      map.kind === "fuel"
    ) {
      return "fuel";
    }

    if (
      map.kind ===
      "ignition"
    ) {
      return "ignition";
    }

    return "boost";
  }
}
