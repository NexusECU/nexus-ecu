import { useEffect, useRef, useState } from "react";

import {
  Activity,
  AlertTriangle,
  Battery,
  Droplets,
  Gauge,
  Settings,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { isTauri } from "@tauri-apps/api/core";

import { EcuController } from "./core/ecuController";
import { ecuModes } from "./core/modes/modeConfig";

import {
  vehicleProfiles,
  type VehicleProfile,
} from "./profiles/vehicleProfiles";

import {
  defaultBoostMap,
  defaultFuelMap,
  defaultIgnitionMap,
} from "./maps/defaultMaps";

import { MapEditor } from "./maps/MapEditor";
import {
  DefinitionBrowser,
} from "./maps/DefinitionBrowser";

import {
  DefinitionEditor,
} from "./maps/DefinitionEditor";

import {
  buildCalibrationDefinitions,
} from "./maps/calibrationDefinitionRegistry";

import {
  DefinitionFileManager,
} from "./maps/DefinitionFileManager";

import {
  DefinitionStudio,
} from "./definitions/DefinitionStudio";

import {
  DefinitionDatabasePanel,
} from "./definitions/DefinitionDatabasePanel";

import {
  RomImageManager,
} from "./rom/RomImageManager";

import {
  RomCalibrationEnginePanel,
} from "./rom/RomCalibrationEnginePanel";

import {
  RomValidationPanel,
} from "./rom/RomValidationPanel";

import {
  validateRomImage,
} from "./rom/romValidationService";

import type {
  RomImageInfo,
} from "./rom/romTypes";

import type {
  NexusDefinitionFile,
} from "./maps/definitionFileTypes";

import type {
  CalibrationDefinition,
} from "./maps/calibrationDefinitionTypes";

import { CalibrationPanel } from "./calibration/CalibrationPanel";
import { FlashManager } from "./flashing/FlashManager";
import { AutoTunePanel } from "./tuning/AutoTunePanel";

import { ProjectBar } from "./desktop/ProjectBar";
import { ProjectManager } from "./desktop/ProjectManager";

import type {
  RevisionCompareCell,
} from "./desktop/RevisionComparePanel";
import { DesktopShell } from "./desktop/DesktopShell";

import {
  HardwareManager,
} from "./hardware/HardwareManager";

import type {
  OperatingMode,
} from "./hardware/hardwareTypes";

import type { DesktopSettings } from "./desktop/desktopSettings";

import {
  createNexusProject,
  createRevision,
  getRecentProjects,
  openProject,
  openRecentProject,
  saveProject,
  saveProjectAs,
  updateProjectSnapshot,
} from "./desktop/projectService";

import type {
  NexusProject,
  RecentProject,
} from "./desktop/projectTypes";

import {
  DataLogger,
  type LogSample,
} from "./logging/DataLogger";

import type {
  CalibrationSet,
} from "./calibration/calibrationManager";

import type {
  EcuMap,
  MapKind,
} from "./maps/mapTypes";

import type {
  DtcRecord,
  EcuMode,
  EcuState,
  ProtectionSettingsState,
  SensorCalibrationState,
  SimulatedSensorFault,
  TestBenchScenarioId,
} from "./types/ecu";

import "./App.css";
import "./ui-cleanup.css";
import "./maps/tuning-workspace.css";
import "./maps/definition-browser.css";
import "./maps/definition-editor.css";
import "./maps/definition-file-manager.css";
import "./definitions/definition-studio.css";
import "./definitions/definition-database.css";
import "./rom/rom-image-manager.css";
import "./rom/rom-calibration-engine.css";
import "./rom/rom-validation.css";
import "./flashing/flash-manager.css";
import "./tuning/auto-tune.css";
import "./desktop/project-bar.css";
import "./desktop/project-manager.css";
import "./desktop/revision-compare.css";
import "./desktop/desktop-shell.css";
import "./hardware/hardware-manager.css";
import "./hardware/can-monitor.css";
import "./hardware/can-signals.css";
import "./hardware/transport-compatibility.css";
import "./hardware/provider-runtime.css";
import "./hardware/j2534-provider.css";
import "./hardware/elm-provider.css";

import {
  testBenchScenarios,
} from "./core/testing/testBench";

import {
  APP_NAME,
  APP_VERSION,
  RELEASE_CHANNEL,
} from "./version";

type ChartPoint = {
  time: number;
  rpm: number;
};

type LambdaChartPoint = {
  time: number;
  targetAfr: number;
  measuredAfr: number;
  fuelTrim: number;
};

type Workspace =
  | "overview"
  | "performance"
  | "tuning"
  | "diagnostics"
  | "setup";

type DynoChartPoint = {
  rpm: number;
  torqueNm: number;
  horsepower: number;
};

const createInitialState = (): EcuState => ({
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
    rpmLimit: 7500,
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
    torqueMultiplier: 0.82,
    throttleAuthority: 0.86,
    boostAllowance: 0.82,
    ignitionBiasDegrees: 0,
    launchBias: 0.85,
    tractionBias: 1,
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
  },

  testBench: {
    running: false,
    scenarioId: null,
    scenarioName: "READY",
    elapsedSeconds: 0,
    durationSeconds: 0,
    progressPercent: 0,
    status: "READY",
    completedRuns: 0,
  },

  faults: [],
});

function cloneMap(map: EcuMap): EcuMap {
  return {
    ...map,

    xAxis: {
      ...map.xAxis,
      values: [...map.xAxis.values],
    },

    yAxis: {
      ...map.yAxis,
      values: [...map.yAxis.values],
    },

    values: map.values.map((row) => [...row]),
  };
}

function cloneMaps(
  maps: CalibrationSet["maps"],
): CalibrationSet["maps"] {
  return {
    fuel: cloneMap(maps.fuel),
    ignition: cloneMap(maps.ignition),
    boost: cloneMap(maps.boost),
  };
}

function App() {
  const ecuRef =
    useRef<EcuController | null>(null);

  const loggingRef =
    useRef(false);

  const logTimeRef =
    useRef(0);

  const [state, setState] =
    useState<EcuState>(
      createInitialState(),
    );

  const [chartData, setChartData] =
    useState<ChartPoint[]>([]);

  const [
    lambdaChartData,
    setLambdaChartData,
  ] = useState<LambdaChartPoint[]>([]);

  const [
    dynoChartData,
    setDynoChartData,
  ] = useState<DynoChartPoint[]>([]);

  const [
    selectedProfileId,
    setSelectedProfileId,
  ] = useState(
    vehicleProfiles[0].id,
  );

  const [profile, setProfile] =
    useState<VehicleProfile>(
      vehicleProfiles[0],
    );

  const [activeMap, setActiveMap] =
    useState<EcuMap>(
      cloneMap(defaultFuelMap),
    );


  const [
    activeDefinitionId,
    setActiveDefinitionId,
  ] = useState(
    "fuel-main",
  );

  const [
    definitionValues,
    setDefinitionValues,
  ] = useState<
    Record<
      string,
      number | boolean | string
    >
  >({});


  const [
    externalDefinitionFile,
    setExternalDefinitionFile,
  ] = useState<
    NexusDefinitionFile | null
  >(
    null,
  );


  const [
    loadedRomImage,
    setLoadedRomImage,
  ] = useState<
    RomImageInfo | null
  >(
    null,
  );


  const [
    originalRomImage,
    setOriginalRomImage,
  ] = useState<
    RomImageInfo | null
  >(
    null,
  );

  const [
    calibrationMaps,
    setCalibrationMaps,
  ] = useState<
    CalibrationSet["maps"]
  >({
    fuel: cloneMap(defaultFuelMap),

    ignition: cloneMap(
      defaultIgnitionMap,
    ),

    boost: cloneMap(
      defaultBoostMap,
    ),
  });


  const builtInDefinitions =
    buildCalibrationDefinitions(
      calibrationMaps,
    );

  const calibrationDefinitions =
    (
      externalDefinitionFile
        ? [
            ...builtInDefinitions.filter(
              (definition) =>
                definition.map !==
                undefined,
            ),
            ...externalDefinitionFile.definitions,
          ]
        : builtInDefinitions
    ).map(
      (definition) => ({
        ...definition,
        value:
          definitionValues[
            definition.id
          ] ??
          definition.value,
      }),
    );

  const activeDefinition =
    calibrationDefinitions.find(
      (definition) =>
        definition.id ===
        activeDefinitionId,
    ) ??
    calibrationDefinitions[0];

  const addDiscoveredDefinition = (
    definition:
      CalibrationDefinition,
  ) => {
    setExternalDefinitionFile(
      (previous) => {
        const now =
          new Date()
            .toISOString();

        if (
          previous
        ) {
          return {
            ...previous,
            updatedAt:
              now,
            definitions: [
              ...previous.definitions,
              definition,
            ],
          };
        }

        return {
          schemaVersion:
            1,
          id:
            "nexus-discovered-definition",
          name:
            "NEXUS Discovered Definition",
          vendor:
            "Unknown",
          ecuFamily:
            "Unknown ECU",
          romId:
            loadedRomImage?.sha256.slice(
              0,
              12,
            ) ??
            "UNKNOWN",
          description:
            "Definition created from NEXUS ROM discovery candidates.",
          createdAt:
            now,
          updatedAt:
            now,
          definitions: [
            definition,
          ],
        };
      },
    );

    setActiveDefinitionId(
      definition.id,
    );

    setProjectDirty(
      true,
    );
  };

  const updateDefinitionValue = (
    id: string,
    value:
      number |
      boolean |
      string,
  ) => {
    setDefinitionValues(
      (previous) => ({
        ...previous,
        [id]: value,
      }),
    );

    setProjectDirty(
      true,
    );
  };

  const [logging, setLogging] =
    useState(false);

  const [
    operatingMode,
    setOperatingMode,
  ] = useState<OperatingMode>(
    "simulator",
  );

  const [
    boostByGearMultipliers,
    setBoostByGearMultipliers,
  ] = useState<
    Record<number, number>
  >({
    1: 0.55,
    2: 0.7,
    3: 0.82,
    4: 0.92,
    5: 1,
    6: 1,
  });

  const [logSamples, setLogSamples] =
    useState<LogSample[]>([]);

  const [
    mapTraceSample,
    setMapTraceSample,
  ] = useState<LogSample | null>(
    null,
  );

  const [
    currentProject,
    setCurrentProject,
  ] = useState<NexusProject>(
    () =>
      createNexusProject({
        name:
          "Untitled Project",

        vehicleProfileId:
          vehicleProfiles[0].id,

        maps: {
          fuel:
            cloneMap(
              defaultFuelMap,
            ),

          ignition:
            cloneMap(
              defaultIgnitionMap,
            ),

          boost:
            cloneMap(
              defaultBoostMap,
            ),
        },
      }),
  );

  const [
    projectPath,
    setProjectPath,
  ] = useState<string | null>(
    null,
  );

  const [
    projectDirty,
    setProjectDirty,
  ] = useState(false);

  const [
    projectBusy,
    setProjectBusy,
  ] = useState(false);

  const [
    projectError,
    setProjectError,
  ] = useState<string | null>(
    null,
  );

  const [
    recentProjects,
    setRecentProjects,
  ] = useState<RecentProject[]>(
    () =>
      getRecentProjects(),
  );

  const [
    desktopSettings,
    setDesktopSettings,
  ] = useState<DesktopSettings | null>(
    null,
  );

  const desktopMode =
    isTauri();

  useEffect(() => {
    if (
      !desktopSettings
    ) {
      return;
    }

    setActiveWorkspace(
      desktopSettings
        .defaultWorkspace,
    );
  }, [
    desktopSettings,
  ]);

  const [
    faultHistory,
    setFaultHistory,
  ] = useState<string[]>([]);

  const [
    activeWorkspace,
    setActiveWorkspace,
  ] = useState<Workspace>(
    "overview",
  );

  useEffect(() => {
    const ecu =
      new EcuController(
        vehicleProfiles[0],
      );

    ecuRef.current = ecu;

    ecu.setMap(
      cloneMap(defaultFuelMap),
    );

    ecu.setMap(
      cloneMap(defaultIgnitionMap),
    );

    ecu.setMap(
      cloneMap(defaultBoostMap),
    );

    const interval =
      window.setInterval(() => {
        const nextState =
          ecu.update(0.05);

        setState(nextState);

        setChartData(
          (previous) => [
            ...previous.slice(-49),

            {
              time: Date.now(),

              rpm: Math.round(
                nextState.sensors.rpm,
              ),
            },
          ],
        );

        setLambdaChartData(
          (previous) => [
            ...previous.slice(-99),

            {
              time: Date.now(),

              targetAfr:
                nextState.lambdaControl
                  .targetAfr,

              measuredAfr:
                nextState.lambdaControl
                  .measuredAfr,

              fuelTrim:
                nextState.lambdaControl
                  .fuelTrimPercent,
            },
          ],
        );

        if (
          nextState.engineRunning &&
          nextState.sensors.rpm >
            500
        ) {
          setDynoChartData(
            (previous) => [
              ...previous.slice(-119),

              {
                rpm:
                  Math.round(
                    nextState.sensors.rpm,
                  ),

                torqueNm:
                  nextState.virtualDyno
                    .torqueNm,

                horsepower:
                  nextState.virtualDyno
                    .horsepower,
              },
            ],
          );
        }

        if (
          loggingRef.current
        ) {
          logTimeRef.current +=
            0.05;

          const boost =
            Math.max(
              0,
              nextState.sensors
                .manifoldPressureKpa -
                101.3,
            ) / 100;

          const sample: LogSample = {
            time:
              logTimeRef.current,

            rpm:
              nextState.sensors.rpm,

            throttle:
              nextState.sensors
                .throttlePosition,

            map:
              nextState.sensors
                .manifoldPressureKpa,

            afr:
              nextState.sensors
                .airFuelRatio,

            ignition:
              nextState.outputs
                .ignitionTimingDegrees,

            boost,

            coolant:
              nextState.sensors
                .coolantTemperatureC,

            intakeAir:
              nextState.sensors
                .intakeAirTemperatureC,

            oilPressure:
              nextState.sensors
                .oilPressureKpa,

            battery:
              nextState.sensors
                .batteryVoltage,

            speed:
              nextState.sensors
                .vehicleSpeedKph,

            engineLoad:
              nextState.sensors
                .engineLoad *
              100,

            targetAfr:
              nextState.lambdaControl
                .targetAfr,

            fuelTrim:
              nextState.lambdaControl
                .fuelTrimPercent,

            knockLevel:
              nextState.knockControl
                .knockLevel,

            gear:
              nextState.transmission
                .currentGear,

            torqueNm:
              nextState.virtualDyno
                .torqueNm,

            horsepower:
              nextState.virtualDyno
                .horsepower,

            events: [
              ...(nextState.knockControl.knockDetected ? ["knock" as const] : []),
              ...(nextState.limiter.active ? ["limiter" as const] : []),
              ...(nextState.engineProtection.active ? ["protection" as const] : []),
              ...(nextState.tractionControl?.active ? ["traction" as const] : []),
              ...(nextState.sensorFaults.active ? ["fault" as const] : []),
            ],
          };

          setLogSamples(
            (previous) => [
              ...previous.slice(
                -4999,
              ),
              sample,
            ],
          );
        }

        if (
          nextState.faults.length >
          0
        ) {
          setFaultHistory(
            (previous) => {
              const newFaults =
                nextState.faults.filter(
                  (fault) =>
                    !previous.includes(
                      fault,
                    ),
                );

              if (
                newFaults.length ===
                0
              ) {
                return previous;
              }

              return [
                ...previous,
                ...newFaults,
              ];
            },
          );
        }
      }, 50);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  const changeOperatingMode = (
    mode: OperatingMode,
  ) => {
    if (
      mode ===
      operatingMode
    ) {
      return;
    }

    if (
      mode ===
      "live"
    ) {
      ecuRef.current?.stopEngine();

      loggingRef.current =
        false;

      setLogging(
        false,
      );

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );

      setActiveWorkspace(
        "setup",
      );
    }

    setOperatingMode(
      mode,
    );
  };

  const startEngine = () => {
    if (
      operatingMode !==
      "simulator"
    ) {
      return;
    }

    ecuRef.current?.startEngine();

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const stopEngine = () => {
    ecuRef.current?.stopEngine();

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setThrottle = (
    value: number,
  ) => {
    if (
      operatingMode !==
      "simulator"
    ) {
      return;
    }

    ecuRef.current?.setThrottle(
      value,
    );
  };

  const setEthanolContent = (
    value: number,
  ) => {
    ecuRef.current?.setEthanolContent(
      value,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setAntiLagEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setAntiLagEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setNoLiftShiftEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setNoLiftShiftEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const triggerNoLiftShift =
    () => {
      ecuRef.current?.triggerNoLiftShift();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const setPitLimiterEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setPitLimiterEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setPitLimiterTargetSpeed = (
    value: number,
  ) => {
    ecuRef.current?.setPitLimiterTargetSpeed(
      value,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setBoostByGearEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setBoostByGearEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setTransmissionEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setTransmissionEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setRollingLaunchEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setRollingLaunchEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setRollingLaunchTargetSpeed = (
    value: number,
  ) => {
    ecuRef.current?.setRollingLaunchTargetSpeed(
      value,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const releaseRollingLaunch =
    () => {
      ecuRef.current?.releaseRollingLaunch();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const setBrakeBoostEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setBrakeBoostEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setBrakePosition = (
    value: number,
  ) => {
    ecuRef.current?.setBrakePosition(
      value,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const releaseBrakeBoost =
    () => {
      ecuRef.current?.releaseBrakeBoost();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const setCurrentGear = (
    gear: number,
  ) => {
    ecuRef.current?.setCurrentGear(
      gear,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setGearBoostMultiplier = (
    gear: number,
    value: number,
  ) => {
    const multiplier =
      Math.max(
        0,
        Math.min(
          1.25,
          value,
        ),
      );

    setBoostByGearMultipliers(
      (previous) => ({
        ...previous,
        [gear]:
          multiplier,
      }),
    );

    ecuRef.current?.setBoostByGearMultiplier(
      gear,
      multiplier,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const toggleSensorFault = (
    fault: SimulatedSensorFault,
  ) => {
    const enabled =
      !state.sensorFaults.activeFaults.includes(
        fault,
      );

    ecuRef.current?.setSensorFault(
      fault,
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const clearSensorFaults =
    () => {
      ecuRef.current?.clearSensorFaults();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const clearDtcs =
    () => {
      ecuRef.current?.clearDtcs();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const updateProtectionSetting = <
    K extends keyof ProtectionSettingsState,
  >(
    key: K,
    value: ProtectionSettingsState[K],
  ) => {
    const next = {
      ...state.protectionSettings,
      [key]: value,
    };

    ecuRef.current?.setProtectionSettings(
      next,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const resetProtectionSettings =
    () => {
      ecuRef.current?.resetProtectionSettings();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const setCanBusEnabled = (
    enabled: boolean,
  ) => {
    ecuRef.current?.setCanBusEnabled(
      enabled,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const setCanBusBitrate = (
    bitrateKbps: number,
  ) => {
    ecuRef.current?.setCanBusBitrate(
      bitrateKbps,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const clearCanBus =
    () => {
      ecuRef.current?.clearCanBus();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const updateSensorCalibration = <
    K extends keyof SensorCalibrationState,
  >(
    key: K,
    value: SensorCalibrationState[K],
  ) => {
    const next = {
      ...state.sensorCalibration,
      [key]: value,
    };

    ecuRef.current?.setSensorCalibration(
      next,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const resetSensorCalibration =
    () => {
      ecuRef.current?.resetSensorCalibration();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const startTestBenchScenario = (
    scenarioId:
      TestBenchScenarioId,
  ) => {
    ecuRef.current?.startTestBenchScenario(
      scenarioId,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const stopTestBenchScenario =
    () => {
      ecuRef.current?.stopTestBenchScenario();

      setState(
        ecuRef.current?.getState() ??
          createInitialState(),
      );
    };

  const changeProfile = (
    profileId: string,
  ) => {
    const selected =
      vehicleProfiles.find(
        (item) =>
          item.id === profileId,
      );

    if (!selected) {
      return;
    }

    ecuRef.current?.setProfile(
      selected,
    );

    setSelectedProfileId(
      selected.id,
    );

    setProfile(selected);

    setProjectDirty(
      true,
    );

    setChartData([]);

    setLambdaChartData([]);

    setDynoChartData([]);

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const changeMode = (
    mode: EcuMode,
  ) => {
    ecuRef.current?.setMode(
      mode,
    );

    setState(
      ecuRef.current?.getState() ??
        createInitialState(),
    );
  };

  const changeMap = (
    mapId: string,
  ) => {
    let selectedMap:
      | EcuMap
      | null = null;

    if (
      mapId ===
      defaultFuelMap.id
    ) {
      selectedMap =
        cloneMap(
          calibrationMaps.fuel,
        );
    }

    if (
      mapId ===
      defaultIgnitionMap.id
    ) {
      selectedMap =
        cloneMap(
          calibrationMaps
            .ignition,
        );
    }

    if (
      mapId ===
      defaultBoostMap.id
    ) {
      selectedMap =
        cloneMap(
          calibrationMaps.boost,
        );
    }

    if (!selectedMap) {
      return;
    }

    setActiveMap(
      selectedMap,
    );
  };

  const countChangedCells = (
    before: EcuMap,
    after: EcuMap,
  ) => {
    let changed = 0;

    after.values.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        if (
          before.values[rowIndex]?.[columnIndex] !== value
        ) {
          changed++;
        }
      });
    });

    return changed;
  };

  const handleMapChange = (
    updatedMap: EcuMap,
  ) => {
    const mapCopy =
      cloneMap(updatedMap);

    setActiveMap(mapCopy);

    setProjectDirty(
      true,
    );

    const changedCells =
      countChangedCells(
        activeMap,
        mapCopy,
      );

    if (changedCells > 0) {
      setCurrentProject(
        (previous) => ({
          ...previous,
          editHistory: [
            ...previous.editHistory,
            {
              id:
                `${Date.now()}-${Math.random()}`,
              createdAt:
                new Date().toISOString(),
              mapId:
                mapCopy.id,
              mapName:
                mapCopy.name,
              changedCells,
            },
          ].slice(-200),
        }),
      );
    }

    ecuRef.current?.setMap(
      mapCopy,
    );

    setCalibrationMaps(
      (previous) => {
        if (
          mapCopy.kind ===
          "fuel"
        ) {
          return {
            ...previous,
            fuel: mapCopy,
          };
        }

        if (
          mapCopy.kind ===
          "ignition"
        ) {
          return {
            ...previous,
            ignition: mapCopy,
          };
        }

        return {
          ...previous,
          boost: mapCopy,
        };
      },
    );
  };

  const loadCalibrationMaps = (
    maps: CalibrationSet["maps"],
  ) => {
    const cloned =
      cloneMaps(maps);

    setCalibrationMaps(
      cloned,
    );

    setActiveMap(
      cloned.fuel,
    );

    ecuRef.current?.setMap(
      cloned.fuel,
    );

    ecuRef.current?.setMap(
      cloned.ignition,
    );

    ecuRef.current?.setMap(
      cloned.boost,
    );
  };

  const applyAutoTuneFuelMap = (
    map: EcuMap,
  ) => {
    const mapCopy =
      cloneMap(
        map,
      );

    setCalibrationMaps(
      (previous) => ({
        ...previous,

        fuel:
          mapCopy,
      }),
    );

    if (
      activeMap.kind ===
      "fuel"
    ) {
      setActiveMap(
        mapCopy,
      );
    }

    ecuRef.current?.setMap(
      mapCopy,
    );

    setProjectDirty(
      true,
    );
  };

  const resetCalibrationMaps =
    () => {
      const maps: CalibrationSet["maps"] =
        {
          fuel: cloneMap(
            defaultFuelMap,
          ),

          ignition: cloneMap(
            defaultIgnitionMap,
          ),

          boost: cloneMap(
            defaultBoostMap,
          ),
        };

      setCalibrationMaps(
        maps,
      );

      setActiveMap(
        maps.fuel,
      );

      ecuRef.current?.setMap(
        maps.fuel,
      );

      ecuRef.current?.setMap(
        maps.ignition,
      );

      ecuRef.current?.setMap(
        maps.boost,
      );

      setProjectDirty(
        true,
      );
    };

  const applyOpenedProject = (
    project: NexusProject,
    path: string,
    recent: RecentProject[],
  ) => {
    const selected =
      vehicleProfiles.find(
        (item) =>
          item.id ===
          project.vehicleProfileId,
      ) ??
      vehicleProfiles[0];

    ecuRef.current?.setProfile(
      selected,
    );

    setSelectedProfileId(
      selected.id,
    );

    setProfile(
      selected,
    );

    loadCalibrationMaps(
      project.maps,
    );

    setCurrentProject(
      project,
    );

    setProjectPath(
      path,
    );

    setRecentProjects(
      recent,
    );

    setProjectDirty(
      false,
    );

    setProjectError(
      null,
    );

    setChartData(
      [],
    );

    setLambdaChartData(
      [],
    );

    setDynoChartData(
      [],
    );
  };

  const newProject =
    () => {
      const maps:
        CalibrationSet["maps"] = {
          fuel:
            cloneMap(
              defaultFuelMap,
            ),

          ignition:
            cloneMap(
              defaultIgnitionMap,
            ),

          boost:
            cloneMap(
              defaultBoostMap,
            ),
        };

      loadCalibrationMaps(
        maps,
      );

      const project =
        createNexusProject({
          name:
            "Untitled Project",

          vehicleProfileId:
            selectedProfileId,

          maps,
        });

      setCurrentProject(
        project,
      );

      setProjectPath(
        null,
      );

      setProjectDirty(
        false,
      );

      setProjectError(
        null,
      );
    };

  const updateProjectMetadata = (
    project: NexusProject,
  ) => {
    setCurrentProject(project);
    setProjectDirty(true);
  };

  const toggleMapFavourite = (
    mapId: string,
  ) => {
    setCurrentProject(
      (previous) => ({
        ...previous,
        favouriteMapIds:
          previous.favouriteMapIds.includes(mapId)
            ? previous.favouriteMapIds.filter((id) => id !== mapId)
            : [...previous.favouriteMapIds, mapId],
      }),
    );
    setProjectDirty(true);
  };

  const createProjectRevision = (
    name: string,
  ) => {
    setCurrentProject(
      (previous) => ({
        ...previous,
        revisions: [
          ...previous.revisions,
          createRevision(
            name || `Revision ${previous.revisions.length + 1}`,
            calibrationMaps,
          ),
        ].slice(-50),
      }),
    );
    setProjectDirty(true);
  };

  const applyRevisionCells = (
    mapKind: MapKind,
    sourceRevisionId: string,
    cells: RevisionCompareCell[],
  ) => {
    const sourceRevision =
      currentProject.revisions.find(
        (revision) =>
          revision.id ===
          sourceRevisionId,
      );

    if (
      !sourceRevision ||
      cells.length ===
        0
    ) {
      return;
    }

    const currentMap =
      calibrationMaps[
        mapKind
      ];

    const sourceMap =
      sourceRevision.maps[
        mapKind
      ];

    const nextMap: EcuMap = {
      ...currentMap,
      xAxis: {
        ...currentMap.xAxis,
        values: [
          ...currentMap.xAxis.values,
        ],
      },
      yAxis: {
        ...currentMap.yAxis,
        values: [
          ...currentMap.yAxis.values,
        ],
      },
      values:
        currentMap.values.map(
          (row: number[]) => [
            ...row,
          ],
        ),
    };

    let changedCells = 0;

    cells.forEach(
      (cell) => {
        const sourceValue =
          sourceMap.values[
            cell.row
          ]?.[
            cell.column
          ];

        const currentValue =
          nextMap.values[
            cell.row
          ]?.[
            cell.column
          ];

        if (
          sourceValue ===
            undefined ||
          currentValue ===
            undefined ||
          Math.abs(
            sourceValue -
            currentValue,
          ) <=
            0.000001
        ) {
          return;
        }

        nextMap.values[
          cell.row
        ][
          cell.column
        ] =
          sourceValue;

        changedCells++;
      },
    );

    if (
      changedCells ===
      0
    ) {
      return;
    }

    handleMapChange(
      nextMap,
    );

    setProjectDirty(
      true,
    );
  };

  const restoreProjectRevision = (
    revisionId: string,
  ) => {
    const revision =
      currentProject.revisions.find(
        (item) => item.id === revisionId,
      );

    if (!revision) {
      return;
    }

    loadCalibrationMaps(
      revision.maps,
    );

    setProjectDirty(true);
  };

  const handleRomDecodedMap = (
    decodedMap: EcuMap,
  ) => {
    setActiveMap(
      decodedMap,
    );

    setCalibrationMaps(
      (previous) => {
        if (
          decodedMap.kind === "fuel"
        ) {
          return {
            ...previous,
            fuel:
              decodedMap,
          };
        }

        if (
          decodedMap.kind === "ignition"
        ) {
          return {
            ...previous,
            ignition:
              decodedMap,
          };
        }

        return {
          ...previous,
          boost:
            decodedMap,
        };
      },
    );

    setProjectDirty(
      true,
    );
  };

  const handleRomBytesChange = (
    bytes: Uint8Array,
  ) => {
    setLoadedRomImage(
      (previous) =>
        previous
          ? {
              ...previous,
              bytes,
            }
          : previous,
    );

    setProjectDirty(
      true,
    );
  };

  const romValidationReport =
    originalRomImage &&
    loadedRomImage
      ? validateRomImage(
          originalRomImage.bytes,
          loadedRomImage.bytes,
          calibrationDefinitions,
          externalDefinitionFile,
        )
      : null;

  const romExportAllowed =
    romValidationReport?.valid ??
    false;

  const openProjectFile =
    async () => {
      try {
        setProjectBusy(
          true,
        );

        setProjectError(
          null,
        );

        const result =
          await openProject();

        if (result) {
          applyOpenedProject(
            result.project,
            result.path,
            result.recent,
          );
        }
      } catch (
        error
      ) {
        setProjectError(
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
        );
      } finally {
        setProjectBusy(
          false,
        );
      }
    };

  const saveCurrentProject =
    async (
      forceSaveAs =
        false,
    ) => {
      try {
        setProjectBusy(
          true,
        );

        setProjectError(
          null,
        );

        const snapshot =
          updateProjectSnapshot(
            currentProject,
            calibrationMaps,
            selectedProfileId,
          );

        if (
          forceSaveAs ||
          !projectPath
        ) {
          const result =
            await saveProjectAs(
              snapshot,
            );

          if (!result) {
            return;
          }

          setCurrentProject(
            result.project,
          );

          setProjectPath(
            result.path,
          );

          setRecentProjects(
            result.recent,
          );

          setProjectDirty(
            false,
          );

          return;
        }

        const result =
          await saveProject(
            snapshot,
            projectPath,
          );

        setCurrentProject(
          result.project,
        );

        setRecentProjects(
          result.recent,
        );

        setProjectDirty(
          false,
        );
      } catch (
        error
      ) {
        setProjectError(
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
        );
      } finally {
        setProjectBusy(
          false,
        );
      }
    };

  const openRecent =
    async (
      recent:
        RecentProject,
    ) => {
      try {
        setProjectBusy(
          true,
        );

        setProjectError(
          null,
        );

        const result =
          await openRecentProject(
            recent,
          );

        applyOpenedProject(
          result.project,
          result.path,
          result.recent,
        );
      } catch (
        error
      ) {
        setProjectError(
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
        );
      } finally {
        setProjectBusy(
          false,
        );
      }
    };

  const inspectLogSampleInMap = (
    sample: LogSample,
  ) => {
    setMapTraceSample(
      sample,
    );

    setActiveWorkspace(
      "tuning",
    );

    setActiveMap(
      cloneMap(
        calibrationMaps.fuel,
      ),
    );
  };

  const startLogging = () => {
    logTimeRef.current = 0;

    setLogSamples([]);

    loggingRef.current =
      true;

    setLogging(true);
  };

  const stopLogging = () => {
    loggingRef.current =
      false;

    setLogging(false);
  };

  const clearLogging = () => {
    if (
      loggingRef.current
    ) {
      return;
    }

    logTimeRef.current = 0;

    setLogSamples([]);
  };

  const exportLogging = () => {
    if (
      logSamples.length ===
      0
    ) {
      return;
    }

    const header = [
      "time_s",
      "rpm",
      "throttle_percent",
      "engine_load_percent",
      "map_kpa",
      "boost_bar",
      "afr",
      "ignition_deg",
      "coolant_c",
      "iat_c",
      "oil_pressure_kpa",
      "battery_v",
      "speed_kph",
      "target_afr",
      "fuel_trim_percent",
      "knock_level_percent",
      "gear",
      "torque_nm",
      "horsepower",
      "events",
    ];

    const rows =
      logSamples.map(
        (sample) =>
          [
            sample.time.toFixed(2),
            sample.rpm.toFixed(0),
            sample.throttle.toFixed(2),
            sample.engineLoad.toFixed(2),
            sample.map.toFixed(2),
            sample.boost.toFixed(3),
            sample.afr.toFixed(2),
            sample.ignition.toFixed(2),
            sample.coolant.toFixed(2),
            sample.intakeAir.toFixed(2),
            sample.oilPressure.toFixed(2),
            sample.battery.toFixed(2),
            sample.speed.toFixed(2),
            (sample.targetAfr ?? 0).toFixed(2),
            (sample.fuelTrim ?? 0).toFixed(2),
            (sample.knockLevel ?? 0).toFixed(2),
            (sample.gear ?? 0).toFixed(0),
            (sample.torqueNm ?? 0).toFixed(2),
            (sample.horsepower ?? 0).toFixed(2),
            `"${(sample.events ?? []).join("|")}"`,
          ].join(","),
      );

    const csv = [
      header.join(","),
      ...rows,
    ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href = url;

    link.download =
      `nexus-ecu-log-${Date.now()}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url,
    );
  };

  const clearFaultHistory =
    () => {
      setFaultHistory([]);
    };

  const activeMode =
    ecuModes[
      state.mode
    ];

  const engineRunning =
    state.engineRunning;

  const redline =
    profile.engine
      .redlineRpm;

  const rpmPercent =
    Math.min(
      100,
      Math.max(
        0,
        (state.sensors.rpm /
          redline) *
          100,
      ),
    );

  const revWarning =
    rpmPercent >= 90;

  const boostBar =
    (state.sensors
      .manifoldPressureKpa -
      101.3) /
    100;

  const boostDisplay =
    Math.max(
      0,
      boostBar,
    );

  const mapDisplay =
    state.sensors
      .manifoldPressureKpa;

  const lambdaActive =
    state.lambdaControl.active;

  const fuelTrim =
    state.lambdaControl
      .fuelTrimPercent;

  const fuelTrimPercent =
    Math.min(
      100,
      Math.abs(
        fuelTrim,
      ) /
        15 *
        100,
    );

  const limiterActive =
    state.limiter.active;

  const boostProtectionActive =
    state.boostProtection.active;

  const knockActive =
    state.knockControl.active;

  const knockPercent =
    Math.min(
      100,
      Math.max(
        0,
        state.knockControl
          .knockLevel *
          100,
      ),
    );

  const engineProtectionActive =
    state.engineProtection.active;

  const engineProtectionLevel =
    state.engineProtection.level;

  const tractionControl =
    state.tractionControl ?? {
      active: false,
      severe: false,
      slipPercent: 0,
      ignitionRetardDegrees: 0,
      boostMultiplier: 1,
      fuelCut: false,
    };

  const tractionActive =
    tractionControl.active;

  const tractionSlipPercent =
    Math.min(
      100,
      Math.max(
        0,
        tractionControl.slipPercent,
      ),
    );

  const workspaceClass = (
    workspace: Workspace,
    className: string,
  ) =>
    `${className} ${
      activeWorkspace === workspace
        ? "workspace-visible"
        : "workspace-hidden"
    }`;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">
            {APP_NAME}
          </div>

          <div className="subtitle">
            ENGINE MANAGEMENT
            PLATFORM
          </div>
        </div>

        <div className="connection">
          <span
            className={`status-dot ${
              engineRunning
                ? "online"
                : ""
            }`}
          />

          {operatingMode ===
          "simulator"
            ? "SIMULATOR"
            : "LIVE ECU"}{" "}
          · V{APP_VERSION}
        </div>
      </header>

      <main className="content">
        <DesktopShell
          dirty={
            projectDirty
          }
          projectName={
            currentProject.name
          }
          projectPath={
            projectPath
          }
          onNew={
            newProject
          }
          onOpen={
            openProjectFile
          }
          onSave={() =>
            saveCurrentProject(
              false,
            )
          }
          onSaveAs={() =>
            saveCurrentProject(
              true,
            )
          }
          onWorkspace={
            setActiveWorkspace
          }
          onSettingsChanged={
            setDesktopSettings
          }
        />

        <ProjectBar
          projectName={
            currentProject.name
          }
          projectPath={
            projectPath
          }
          dirty={
            projectDirty
          }
          desktopMode={
            desktopMode
          }
          busy={
            projectBusy
          }
          recentProjects={
            recentProjects
          }
          onNew={
            newProject
          }
          onOpen={
            openProjectFile
          }
          onSave={() =>
            saveCurrentProject(
              false,
            )
          }
          onSaveAs={() =>
            saveCurrentProject(
              true,
            )
          }
          onOpenRecent={
            openRecent
          }
        />

        {projectError && (
          <div className="project-error">
            {projectError}
          </div>
        )}

        <ProjectManager
          project={
            currentProject
          }
          maps={
            calibrationMaps
          }
          dirty={
            projectDirty
          }
          onProjectChange={
            updateProjectMetadata
          }
          onCreateRevision={
            createProjectRevision
          }
          onRestoreRevision={
            restoreProjectRevision
          }
          onApplyRevisionCells={
            applyRevisionCells
          }
        />

        <HardwareManager
            loadedRomImage={
              loadedRomImage
            }
          operatingMode={
            operatingMode
          }
          onOperatingModeChange={
            changeOperatingMode
          }
        />

        <section className="hero">
          <div>
            <span className="eyebrow">
              ENGINE STATUS
            </span>

            <h1>
              {engineRunning
                ? "RUNNING"
                : "STOPPED"}
            </h1>

            <p>
              MODE:{" "}
              {activeMode.name}
            </p>
          </div>

          {engineRunning ? (
            <button
              className="engine-button stop"
              onClick={
                stopEngine
              }
            >
              STOP ENGINE
            </button>
          ) : (
            <button
              className="engine-button"
              onClick={
                startEngine
              }
            >
              START ENGINE
            </button>
          )}
        </section>

        <nav
          className="workspace-nav"
          aria-label="Nexus ECU workspace"
        >
          {(
            [
              [
                "overview",
                "Overview",
              ],
              [
                "performance",
                "Performance",
              ],
              [
                "tuning",
                "Tuning",
              ],
              [
                "diagnostics",
                "Diagnostics",
              ],
              [
                "setup",
                "Setup",
              ],
            ] as [
              Workspace,
              string,
            ][]
          ).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                className={`workspace-tab ${
                  activeWorkspace ===
                  id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveWorkspace(
                    id,
                  )
                }
              >
                {label}
              </button>
            ),
          )}
        </nav>

        <div className="workspace-summary">
          <div>
            <span className="eyebrow">
              ACTIVE WORKSPACE:{"\u00A0"}
            </span>

            <strong>
              {activeWorkspace.toUpperCase()}
            </strong>
          </div>

          <div className="workspace-summary-status">
            <span
              className={`status-dot ${
                engineRunning
                  ? "online"
                  : ""
              }`}
            />

            {engineRunning
              ? `${Math.round(
                  state.sensors.rpm,
                ).toLocaleString()} RPM`
              : "ENGINE OFF"}
          </div>
        </div>

        <section
          className={workspaceClass(
            "overview",
            "instrument-section",
          )}
        >
          <div className="instrument-header">
            <div>
              <span className="eyebrow">
                DIGITAL INSTRUMENT
                CLUSTER
              </span>

              <h2>
                Live Vehicle
                Telemetry
              </h2>
            </div>

            <div
              className={`engine-indicator ${
                engineRunning
                  ? "running"
                  : ""
              } ${
                revWarning ||
                state.limiter
                  .hardLimitActive ||
                state.boostProtection
                  .cutActive ||
                state.knockControl
                  .severeKnock ||
                state.engineProtection
                  .level === "limp" ||
                state.engineProtection
                  .level === "shutdown" ||
                tractionControl.severe
                  ? "warning"
                  : ""
              }`}
            >
              <span className="status-dot" />

              {state.engineProtection
                .level === "shutdown"
                ? "ENGINE SHUTDOWN"
                : state.engineProtection
                    .level === "limp"
                  ? "LIMP MODE"
                  : tractionControl.severe
                    ? "TRACTION CONTROL SEVERE"
                    : tractionControl.active
                      ? "TRACTION CONTROL"
                      : state.knockControl
                      .severeKnock
                    ? "SEVERE KNOCK"
                    : state.boostProtection
                    .cutActive
                  ? "OVERBOOST CUT"
                  : state.boostProtection
                      .warningActive
                    ? "BOOST WARNING"
                    : state.knockControl
                        .knockDetected
                      ? "KNOCK DETECTED"
                      : state.limiter
                          .launchControlActive
                        ? "LAUNCH CONTROL"
                        : state.limiter
                            .hardLimitActive
                          ? "HARD LIMIT"
                          : state.limiter
                              .softLimitActive
                            ? "SOFT LIMIT"
                            : engineRunning
                              ? "ENGINE ACTIVE"
                              : "ENGINE OFF"}
            </div>
          </div>

          <div className="instrument-grid">
            <GaugeCard
              icon={<Gauge />}
              label="RPM"
              value={Math.round(
                state.sensors.rpm,
              ).toLocaleString()}
              unit="RPM"
              percent={rpmPercent}
              maxLabel={redline.toLocaleString()}
            />

            <GaugeCard
              icon={<Activity />}
              label="VEHICLE SPEED"
              value={state.sensors.vehicleSpeedKph.toFixed(
                0,
              )}
              unit="KM/H"
              percent={Math.min(
                100,
                (state.sensors.vehicleSpeedKph /
                  320) *
                  100,
              )}
              maxLabel="320"
            />

            <GaugeCard
              icon={<Wind />}
              label="BOOST"
              value={boostDisplay.toFixed(
                2,
              )}
              unit="BAR"
              percent={Math.min(
                100,
                (boostDisplay /
                  3) *
                  100,
              )}
              maxLabel="3.00"
              danger={
                state.boostProtection
                  .warningActive
              }
            />

            <GaugeCard
              icon={<Activity />}
              label="MANIFOLD"
              value={mapDisplay.toFixed(
                1,
              )}
              unit="KPA"
              percent={Math.min(
                100,
                (mapDisplay /
                  450) *
                  100,
              )}
              maxLabel="450"
            />

            <GaugeCard
              icon={<Thermometer />}
              label="COOLANT"
              value={state.sensors.coolantTemperatureC.toFixed(
                1,
              )}
              unit="°C"
              percent={Math.min(
                100,
                (state.sensors.coolantTemperatureC /
                  130) *
                  100,
              )}
              maxLabel="130"
              danger={
                state.sensors
                  .coolantTemperatureC >=
                110
              }
            />

            <GaugeCard
              icon={<Droplets />}
              label="OIL PRESSURE"
              value={state.sensors.oilPressureKpa.toFixed(
                0,
              )}
              unit="KPA"
              percent={Math.min(
                100,
                (state.sensors.oilPressureKpa /
                  650) *
                  100,
              )}
              maxLabel="650"
              danger={
                state.sensors
                  .oilPressureKpa <
                  100 &&
                state.sensors.rpm >
                  1500
              }
            />

            <GaugeCard
              icon={<Battery />}
              label="BATTERY"
              value={state.sensors.batteryVoltage.toFixed(
                2,
              )}
              unit="V"
              percent={Math.min(
                100,
                ((state.sensors.batteryVoltage -
                  10) /
                  5) *
                  100,
              )}
              maxLabel="15.0"
            />

            <GaugeCard
              icon={<Thermometer />}
              label="INTAKE AIR"
              value={state.sensors.intakeAirTemperatureC.toFixed(
                1,
              )}
              unit="°C"
              percent={Math.min(
                100,
                state.sensors
                  .intakeAirTemperatureC,
              )}
              maxLabel="100"
            />
          </div>

          <div className="telemetry-strip">
            <TelemetryItem
              label="THROTTLE"
              value={`${Math.round(
                state.sensors
                  .throttlePosition,
              )}%`}
            />

            <TelemetryItem
              label="ENGINE LOAD"
              value={`${Math.round(
                state.sensors
                  .engineLoad *
                  100,
              )}%`}
            />

            <TelemetryItem
              label="AFR"
              value={state.sensors.airFuelRatio.toFixed(
                2,
              )}
            />

            <TelemetryItem
              label="TARGET AFR"
              value={state.lambdaControl.targetAfr.toFixed(
                2,
              )}
            />

            <TelemetryItem
              label="STFT"
              value={formatSigned(
                state.lambdaControl
                  .fuelTrimPercent,
                1,
                "%",
              )}
            />

            <TelemetryItem
              label="CLOSED LOOP"
              value={
                lambdaActive
                  ? "ACTIVE"
                  : "OPEN LOOP"
              }
            />

            <TelemetryItem
              label="REV LIMIT"
              value={`${Math.round(
                state.limiter.rpmLimit,
              )} RPM`}
            />

            <TelemetryItem
              label="LIMITER"
              value={
                state.limiter
                  .hardLimitActive
                  ? "HARD CUT"
                  : state.limiter
                      .softLimitActive
                    ? "SOFT LIMIT"
                    : "READY"
              }
            />

            <TelemetryItem
              label="LAUNCH"
              value={
                state.limiter
                  .launchControlActive
                  ? "ACTIVE"
                  : "READY"
              }
            />

            <TelemetryItem
              label="BOOST PROTECTION"
              value={
                state.boostProtection
                  .cutActive
                  ? "CUT"
                  : state.boostProtection
                      .warningActive
                    ? "WARNING"
                    : "READY"
              }
            />

            <TelemetryItem
              label="BOOST SAFETY"
              value={`${state.boostProtection.boostBar.toFixed(
                2,
              )} BAR`}
            />

            <TelemetryItem
              label="KNOCK"
              value={
                state.knockControl
                  .severeKnock
                  ? "SEVERE"
                  : state.knockControl
                      .knockDetected
                    ? "DETECTED"
                    : "CLEAR"
              }
            />

            <TelemetryItem
              label="KNOCK RETARD"
              value={`${state.knockControl.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="KNOCK COUNT"
              value={state.knockControl.knockCount.toLocaleString()}
            />

            <TelemetryItem
              label="ENGINE PROTECTION"
              value={state.engineProtection.level.toUpperCase()}
            />

            <TelemetryItem
              label="PROTECTION RETARD"
              value={`${state.engineProtection.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="BOOST LIMIT"
              value={`${Math.round(
                state.engineProtection.boostMultiplier * 100,
              )}%`}
            />

            <TelemetryItem
              label="TRACTION CONTROL"
              value={
                tractionControl.severe
                  ? "SEVERE"
                  : tractionControl.active
                    ? "ACTIVE"
                    : "READY"
              }
            />

            <TelemetryItem
              label="WHEEL SLIP"
              value={`${tractionControl.slipPercent.toFixed(
                1,
              )}%`}
            />

            <TelemetryItem
              label="TC RETARD"
              value={`${tractionControl.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="TC BOOST"
              value={`${Math.round(
                tractionControl.boostMultiplier * 100,
              )}%`}
            />

            <TelemetryItem
              label="ETHANOL"
              value={`E${Math.round(
                state.flexFuel.ethanolPercent,
              )}`}
            />

            <TelemetryItem
              label="FLEX FUEL"
              value={
                state.flexFuel.active
                  ? "ACTIVE"
                  : "PETROL"
              }
            />

            <TelemetryItem
              label="FUEL COMP"
              value={`${(
                state.flexFuel.fuelMultiplier *
                  100 -
                100
              ).toFixed(1)}%`}
            />

            <TelemetryItem
              label="ANTI-LAG"
              value={
                state.antiLag.thermalProtection
                  ? "THERMAL CUT"
                  : state.antiLag.active
                    ? "ACTIVE"
                    : state.antiLag.enabled
                      ? "ARMED"
                      : "OFF"
              }
            />

            <TelemetryItem
              label="ALS RETARD"
              value={`${state.antiLag.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="ALS FUEL"
              value={`+${state.antiLag.fuelEnrichmentPercent.toFixed(
                1,
              )}%`}
            />

            <TelemetryItem
              label="NO-LIFT SHIFT"
              value={
                state.noLiftShift.active
                  ? "SHIFT CUT"
                  : state.noLiftShift.recovering
                    ? "RECOVERY"
                    : state.noLiftShift.armed
                      ? "ARMED"
                      : state.noLiftShift.enabled
                        ? "READY"
                        : "OFF"
              }
            />

            <TelemetryItem
              label="SHIFT RETARD"
              value={`${state.noLiftShift.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="SHIFT TIMER"
              value={`${state.noLiftShift.timerMs.toFixed(
                0,
              )} ms`}
            />

            <TelemetryItem
              label="PIT LIMITER"
              value={
                state.pitLimiter.hardCutActive
                  ? "HARD CUT"
                  : state.pitLimiter.active
                    ? "LIMITING"
                    : state.pitLimiter.enabled
                      ? "ARMED"
                      : "OFF"
              }
            />

            <TelemetryItem
              label="PIT TARGET"
              value={`${state.pitLimiter.targetSpeedKph.toFixed(
                0,
              )} KM/H`}
            />

            <TelemetryItem
              label="PIT RETARD"
              value={`${state.pitLimiter.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="GEAR"
              value={`${state.boostByGear.currentGear}`}
            />

            <TelemetryItem
              label="BOOST BY GEAR"
              value={
                state.boostByGear.active
                  ? "LIMITING"
                  : state.boostByGear.enabled
                    ? "ACTIVE"
                    : "OFF"
              }
            />

            <TelemetryItem
              label="GEAR BOOST"
              value={`${Math.round(
                state.boostByGear.multiplier *
                  100,
              )}%`}
            />

            <TelemetryItem
              label="TRANSMISSION"
              value={
                state.transmission.shiftOccurred
                  ? state.transmission.shiftUpRequested
                    ? "SHIFT UP"
                    : "SHIFT DOWN"
                  : state.transmission.enabled
                    ? "AUTO"
                    : "MANUAL"
              }
            />

            <TelemetryItem
              label="AUTO GEAR"
              value={`${state.transmission.currentGear}`}
            />

            <TelemetryItem
              label="SHIFT STATE"
              value={state.transmission.reason}
            />

            <TelemetryItem
              label="TORQUE MGMT"
              value={
                state.torqueManagement.active
                  ? "ACTIVE"
                  : "READY"
              }
            />

            <TelemetryItem
              label="TORQUE REQUEST"
              value={`${state.torqueManagement.requestedTorquePercent.toFixed(
                0,
              )}%`}
            />

            <TelemetryItem
              label="TORQUE DELIVERED"
              value={`${state.torqueManagement.deliveredTorquePercent.toFixed(
                0,
              )}%`}
            />

            <TelemetryItem
              label="MODE TORQUE"
              value={`${Math.round(
                state.driveModeTorque.torqueMultiplier *
                  100,
              )}%`}
            />

            <TelemetryItem
              label="MODE BOOST"
              value={`${Math.round(
                state.driveModeTorque.boostAllowance *
                  100,
              )}%`}
            />

            <TelemetryItem
              label="MODE THROTTLE"
              value={`${Math.round(
                state.driveModeTorque.throttleAuthority *
                  100,
              )}%`}
            />

            <TelemetryItem
              label="ROLLING LAUNCH"
              value={
                state.rollingLaunch.active
                  ? "BOOST BUILD"
                  : state.rollingLaunch.armed
                    ? "ARMED"
                    : state.rollingLaunch.enabled
                      ? "READY"
                      : "OFF"
              }
            />

            <TelemetryItem
              label="ROLL TARGET"
              value={`${state.rollingLaunch.targetSpeedKph.toFixed(
                0,
              )} KM/H`}
            />

            <TelemetryItem
              label="ROLL RETARD"
              value={`${state.rollingLaunch.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="BRAKE BOOST"
              value={
                state.brakeBoost.thermalProtection
                  ? "THERMAL"
                  : state.brakeBoost.active
                    ? "BOOST BUILD"
                    : state.brakeBoost.armed
                      ? "ARMED"
                      : state.brakeBoost.enabled
                        ? "READY"
                        : "OFF"
              }
            />

            <TelemetryItem
              label="BRAKE"
              value={`${state.brakeBoost.brakePosition.toFixed(
                0,
              )}%`}
            />

            <TelemetryItem
              label="BRAKE RETARD"
              value={`${state.brakeBoost.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="TORQUE"
              value={`${state.virtualDyno.torqueNm.toFixed(
                0,
              )} NM`}
            />

            <TelemetryItem
              label="POWER"
              value={`${state.virtualDyno.horsepower.toFixed(
                0,
              )} HP`}
            />

            <TelemetryItem
              label="PEAK HP"
              value={`${state.virtualDyno.peakHorsepower.toFixed(
                0,
              )} HP`}
            />

            <TelemetryItem
              label="SENSOR FAULTS"
              value={`${state.sensorFaults.activeFaults.length}`}
            />

            <TelemetryItem
              label="DTC STATUS"
              value={
                state.sensorFaults.limpModeRequested
                  ? "LIMP MODE"
                  : state.sensorFaults.active
                    ? "FAULT"
                    : "CLEAR"
              }
            />

            <TelemetryItem
              label="MIL"
              value={
                state.diagnostics.milActive
                  ? "ON"
                  : "OFF"
              }
            />

            <TelemetryItem
              label="CURRENT DTC"
              value={`${state.diagnostics.current.length}`}
            />

            <TelemetryItem
              label="STORED DTC"
              value={`${state.diagnostics.stored.length}`}
            />

            <TelemetryItem
              label="CAN BUS"
              value={
                state.canBus.enabled
                  ? state.canBus.status.toUpperCase()
                  : "OFF"
              }
            />

            <TelemetryItem
              label="CAN LOAD"
              value={`${state.canBus.busLoadPercent.toFixed(
                1,
              )}%`}
            />

            <TelemetryItem
              label="CAN TX"
              value={`${state.canBus.txFrames}`}
            />

            <TelemetryItem
              label="TEST BENCH"
              value={
                state.testBench.running
                  ? state.testBench.status
                  : state.testBench.status
              }
            />

            <TelemetryItem
              label="TEST PROGRESS"
              value={`${state.testBench.progressPercent.toFixed(
                0,
              )}%`}
            />

            <TelemetryItem
              label="FALLBACK TORQUE"
              value={`${Math.round(
                state.sensorFaults.torqueMultiplier *
                  100,
              )}%`}
            />

            <TelemetryItem
              label="INJECTOR PW"
              value={`${state.outputs.injectorPulseWidthMs.toFixed(
                2,
              )} ms`}
            />

            <TelemetryItem
              label="IGNITION"
              value={`${state.outputs.ignitionTimingDegrees.toFixed(
                1,
              )}°`}
            />

            <TelemetryItem
              label="BOOST DUTY"
              value={`${Math.round(
                state.outputs
                  .boostControlDuty,
              )}%`}
            />

            <TelemetryItem
              label="FUEL PUMP"
              value={`${Math.round(
                state.outputs
                  .fuelPumpDuty,
              )}%`}
            />

            <TelemetryItem
              label="COOLING FAN"
              value={`${Math.round(
                state.outputs
                  .coolingFanDuty,
              )}%`}
            />
          </div>
        </section>

        <section className={workspaceClass(
            "overview",
            "panel lambda-panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                CLOSED-LOOP FUEL CONTROL
              </span>

              <h2>
                Lambda / AFR Control
              </h2>

              <p className="profile-description">
                Fuel correction based on
                target AFR versus simulated
                wideband AFR.
              </p>
            </div>

            <div
              className={`lambda-status ${
                lambdaActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  lambdaActive
                    ? "online"
                    : ""
                }`}
              />

              {lambdaActive
                ? "CLOSED LOOP"
                : "OPEN LOOP"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="TARGET AFR"
              value={state.lambdaControl.targetAfr.toFixed(
                2,
              )}
            />

            <LambdaValue
              label="MEASURED AFR"
              value={state.lambdaControl.measuredAfr.toFixed(
                2,
              )}
            />

            <LambdaValue
              label="AFR ERROR"
              value={formatSigned(
                state.lambdaControl
                  .errorAfr,
                2,
                "",
              )}
            />

            <LambdaValue
              label="SHORT TERM FUEL TRIM"
              value={formatSigned(
                fuelTrim,
                1,
                "%",
              )}
            />

            <LambdaValue
              label="CONTROL MODE"
              value={
                lambdaActive
                  ? "CLOSED LOOP"
                  : "OPEN LOOP"
              }
            />

            <LambdaValue
              label="INJECTOR PW"
              value={`${state.outputs.injectorPulseWidthMs.toFixed(
                2,
              )} ms`}
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                FUEL TRIM:{"\u00A0"}
              </span>

              <strong>
                {formatSigned(
                  fuelTrim,
                  1,
                  "%",
                )}
              </strong>
            </div>

            <div className="lambda-trim-track">
              <div className="lambda-trim-center" />

              {fuelTrim >= 0 ? (
                <div
                  className="lambda-trim-fill positive"
                  style={{
                    width: `${fuelTrimPercent /
                      2}%`,
                  }}
                />
              ) : (
                <div
                  className="lambda-trim-fill negative"
                  style={{
                    width: `${fuelTrimPercent /
                      2}%`,
                  }}
                />
              )}
            </div>
          </div>

          <div className="lambda-chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  lambdaChartData
                }
              >
                <XAxis
                  dataKey="time"
                  hide
                />

                <YAxis
                  domain={[
                    10,
                    16,
                  ]}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="targetAfr"
                  name="Target AFR"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="measuredAfr"
                  name="Measured AFR"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ENGINE LIMITING
              </span>

              <h2>
                Rev Limiter & Launch Control
              </h2>

              <p className="profile-description">
                Simulation of soft ignition
                retard, hard fuel cut and
                launch RPM limiting.
              </p>
            </div>

            <div
              className={`lambda-status ${
                limiterActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  limiterActive
                    ? "online"
                    : ""
                }`}
              />

              {state.limiter
                .launchControlActive
                ? "LAUNCH ACTIVE"
                : state.limiter
                    .hardLimitActive
                  ? "HARD LIMIT"
                  : state.limiter
                      .softLimitActive
                    ? "SOFT LIMIT"
                    : "READY"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="ACTIVE LIMIT"
              value={`${Math.round(
                state.limiter.rpmLimit,
              )} RPM`}
            />

            <LambdaValue
              label="SOFT LIMIT"
              value={
                state.limiter
                  .softLimitActive
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="HARD LIMIT"
              value={
                state.limiter
                  .hardLimitActive
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                state.limiter.fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.limiter.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="LAUNCH CONTROL"
              value={
                state.limiter
                  .launchControlActive
                  ? "ACTIVE"
                  : "READY"
              }
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                BOOST SAFETY
              </span>

              <h2>
                Boost Protection
              </h2>

              <p className="profile-description">
                Simulated ignition retard,
                boost-control cut and fuel
                cut for excessive boost.
              </p>
            </div>

            <div
              className={`lambda-status ${
                boostProtectionActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  boostProtectionActive
                    ? "online"
                    : ""
                }`}
              />

              {state.boostProtection
                .cutActive
                ? "OVERBOOST CUT"
                : state.boostProtection
                    .warningActive
                  ? "BOOST WARNING"
                  : "READY"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="BOOST"
              value={`${state.boostProtection.boostBar.toFixed(
                2,
              )} BAR`}
            />

            <LambdaValue
              label="BOOST PRESSURE"
              value={`${state.boostProtection.boostKpa.toFixed(
                1,
              )} KPA`}
            />

            <LambdaValue
              label="WARNING"
              value={
                state.boostProtection
                  .warningActive
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="OVERBOOST CUT"
              value={
                state.boostProtection
                  .cutActive
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.boostProtection.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="BOOST CONTROL CUT"
              value={
                state.boostProtection
                  .boostCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                state.boostProtection
                  .fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                COMBUSTION PROTECTION
              </span>

              <h2>
                Knock Detection &
                Ignition Correction
              </h2>

              <p className="profile-description">
                Simulated knock monitoring
                with automatic ignition
                retard and severe-knock
                boost intervention.
              </p>
            </div>

            <div
              className={`lambda-status ${
                knockActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  knockActive
                    ? "online"
                    : ""
                }`}
              />

              {state.knockControl
                .severeKnock
                ? "SEVERE KNOCK"
                : state.knockControl
                    .knockDetected
                  ? "KNOCK ACTIVE"
                  : "MONITORING"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="KNOCK STATUS"
              value={
                state.knockControl
                  .severeKnock
                  ? "SEVERE"
                  : state.knockControl
                      .knockDetected
                    ? "DETECTED"
                    : "CLEAR"
              }
            />

            <LambdaValue
              label="KNOCK LEVEL"
              value={`${knockPercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.knockControl.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="KNOCK COUNT"
              value={state.knockControl.knockCount.toLocaleString()}
            />

            <LambdaValue
              label="SEVERE KNOCK"
              value={
                state.knockControl
                  .severeKnock
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="BOOST RESPONSE"
              value={
                state.knockControl
                  .severeKnock
                  ? "CUT"
                  : "NORMAL"
              }
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                KNOCK INTENSITY:{"\u00A0"}
              </span>

              <strong>
                {knockPercent.toFixed(
                  1,
                )}
                %
              </strong>
            </div>

            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${knockPercent}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ENGINE PROTECTION
              </span>

              <h2>
                Protection Manager
              </h2>

              <p className="profile-description">
                Unified protection for knock,
                overboost, coolant, oil pressure,
                AFR and engine overspeed.
              </p>
            </div>

            <div
              className={`lambda-status ${
                engineProtectionActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  engineProtectionActive
                    ? "online"
                    : ""
                }`}
              />

              {engineProtectionLevel.toUpperCase()}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="PROTECTION LEVEL"
              value={engineProtectionLevel.toUpperCase()}
            />

            <LambdaValue
              label="BOOST ALLOWANCE"
              value={`${Math.round(
                state.engineProtection.boostMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="RPM ALLOWANCE"
              value={`${Math.round(
                state.engineProtection.rpmLimitMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.engineProtection.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="FUEL ENRICHMENT"
              value={`${state.engineProtection.fuelEnrichmentPercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                state.engineProtection.fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="SHUTDOWN REQUEST"
              value={
                state.engineProtection.shutdownRequested
                  ? "ACTIVE"
                  : "OFF"
              }
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                ACTIVE PROTECTION REASONS:{"\u00A0"}
              </span>

              <strong>
                {state.engineProtection.reasons.length}
              </strong>
            </div>

            {state.engineProtection.reasons.length === 0 ? (
              <div className="logger-empty">
                No engine protection intervention active.
              </div>
            ) : (
              <div className="fault-history">
                {state.engineProtection.reasons.map(
                  (reason) => (
                    <div
                      key={reason}
                      className="fault-history-item"
                    >
                      <AlertTriangle size={16} />
                      <span>{reason}</span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                VEHICLE DYNAMICS
              </span>

              <h2>
                Traction Control
              </h2>

              <p className="profile-description">
                Simulated wheel-slip control using
                ignition retard, boost reduction and
                fuel cut intervention.
              </p>
            </div>

            <div
              className={`lambda-status ${
                tractionActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  tractionActive
                    ? "online"
                    : ""
                }`}
              />

              {tractionControl.severe
                ? "SEVERE INTERVENTION"
                : tractionControl.active
                  ? "TC ACTIVE"
                  : "READY"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="TC STATUS"
              value={
                tractionControl.severe
                  ? "SEVERE"
                  : tractionControl.active
                    ? "ACTIVE"
                    : "READY"
              }
            />

            <LambdaValue
              label="WHEEL SLIP"
              value={`${tractionControl.slipPercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${tractionControl.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="BOOST ALLOWANCE"
              value={`${Math.round(
                tractionControl.boostMultiplier * 100,
              )}%`}
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                tractionControl.fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />

            <LambdaValue
              label="VEHICLE SPEED"
              value={`${state.sensors.vehicleSpeedKph.toFixed(
                0,
              )} KM/H`}
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                WHEEL SLIP:{"\u00A0"}
              </span>

              <strong>
                {tractionControl.slipPercent.toFixed(
                  1,
                )}
                %
              </strong>
            </div>

            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${tractionSlipPercent}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className={workspaceClass(
            "tuning",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                SENSOR INPUT CONFIGURATION
              </span>

              <h2>
                Sensor Calibration
              </h2>

              <p className="profile-description">
                Configure simulated TPS span, MAP range,
                wideband AFR limits, temperature offsets,
                oil-pressure scaling and battery-voltage
                scaling.
              </p>
            </div>

            <button
              className="logger-button"
              onClick={
                resetSensorCalibration
              }
            >
              RESET SENSOR CALIBRATION
            </button>
          </div>

          <div className="protection-settings-grid">
            <ProtectionInput
              label="TPS MIN RAW"
              value={
                state.sensorCalibration
                  .tpsMinRaw
              }
              min={0}
              max={95}
              step={1}
              unit="%"
              onChange={(value) =>
                updateSensorCalibration(
                  "tpsMinRaw",
                  value,
                )
              }
            />

            <ProtectionInput
              label="TPS MAX RAW"
              value={
                state.sensorCalibration
                  .tpsMaxRaw
              }
              min={1}
              max={100}
              step={1}
              unit="%"
              onChange={(value) =>
                updateSensorCalibration(
                  "tpsMaxRaw",
                  value,
                )
              }
            />

            <ProtectionInput
              label="MAP MIN"
              value={
                state.sensorCalibration
                  .mapMinKpa
              }
              min={0}
              max={150}
              step={5}
              unit="KPA"
              onChange={(value) =>
                updateSensorCalibration(
                  "mapMinKpa",
                  value,
                )
              }
            />

            <ProtectionInput
              label="MAP MAX"
              value={
                state.sensorCalibration
                  .mapMaxKpa
              }
              min={100}
              max={500}
              step={10}
              unit="KPA"
              onChange={(value) =>
                updateSensorCalibration(
                  "mapMaxKpa",
                  value,
                )
              }
            />

            <ProtectionInput
              label="WIDEBAND MIN AFR"
              value={
                state.sensorCalibration
                  .widebandMinAfr
              }
              min={5}
              max={15}
              step={0.1}
              unit="AFR"
              onChange={(value) =>
                updateSensorCalibration(
                  "widebandMinAfr",
                  value,
                )
              }
            />

            <ProtectionInput
              label="WIDEBAND MAX AFR"
              value={
                state.sensorCalibration
                  .widebandMaxAfr
              }
              min={10}
              max={25}
              step={0.1}
              unit="AFR"
              onChange={(value) =>
                updateSensorCalibration(
                  "widebandMaxAfr",
                  value,
                )
              }
            />

            <ProtectionInput
              label="COOLANT OFFSET"
              value={
                state.sensorCalibration
                  .coolantOffsetC
              }
              min={-30}
              max={30}
              step={0.5}
              unit="°C"
              onChange={(value) =>
                updateSensorCalibration(
                  "coolantOffsetC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="IAT OFFSET"
              value={
                state.sensorCalibration
                  .iatOffsetC
              }
              min={-30}
              max={30}
              step={0.5}
              unit="°C"
              onChange={(value) =>
                updateSensorCalibration(
                  "iatOffsetC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="OIL PRESSURE SCALE"
              value={
                state.sensorCalibration
                  .oilPressureScale
              }
              min={0.5}
              max={1.5}
              step={0.01}
              unit="x"
              onChange={(value) =>
                updateSensorCalibration(
                  "oilPressureScale",
                  value,
                )
              }
            />

            <ProtectionInput
              label="BATTERY SCALE"
              value={
                state.sensorCalibration
                  .batteryVoltageScale
              }
              min={0.8}
              max={1.2}
              step={0.01}
              unit="x"
              onChange={(value) =>
                updateSensorCalibration(
                  "batteryVoltageScale",
                  value,
                )
              }
            />
          </div>
        </section>

        <section className={workspaceClass(
            "diagnostics",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                VEHICLE NETWORK
              </span>

              <h2>
                CAN / Data Bus
              </h2>

              <p className="profile-description">
                Simulated ECU broadcast network with
                live CAN frames, bus load, bitrate and
                message counters.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.canBus.enabled
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.canBus.enabled
                    ? "online"
                    : ""
                }`}
              />

              {state.canBus.enabled
                ? state.canBus.status.toUpperCase()
                : "OFFLINE"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="BITRATE"
              value={`${state.canBus.bitrateKbps} KBPS`}
            />

            <LambdaValue
              label="BUS LOAD"
              value={`${state.canBus.busLoadPercent.toFixed(
                2,
              )}%`}
            />

            <LambdaValue
              label="TX FRAMES"
              value={`${state.canBus.txFrames}`}
            />

            <LambdaValue
              label="RX FRAMES"
              value={`${state.canBus.rxFrames}`}
            />

            <LambdaValue
              label="ERRORS"
              value={`${state.canBus.errorCount}`}
            />

            <LambdaValue
              label="DROPPED"
              value={`${state.canBus.droppedFrames}`}
            />

            <LambdaValue
              label="LAST FRAME"
              value={state.canBus.lastFrameId}
            />

            <LambdaValue
              label="STATUS"
              value={state.canBus.status.toUpperCase()}
            />
          </div>

          <div className="control-grid">
            <button
              className={`engine-button ${
                state.canBus.enabled
                  ? "stop"
                  : ""
              }`}
              onClick={() =>
                setCanBusEnabled(
                  !state.canBus.enabled,
                )
              }
            >
              {state.canBus.enabled
                ? "DISABLE CAN BUS"
                : "ENABLE CAN BUS"}
            </button>

            <button
              className="logger-button"
              onClick={
                clearCanBus
              }
            >
              CLEAR BUS COUNTERS
            </button>
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                BUS BITRATE:{"\u00A0"}
              </span>

              <strong>
                {state.canBus.bitrateKbps} KBPS
              </strong>
            </div>

            <div className="mode-grid">
              {[125, 250, 500, 1000].map(
                (rate) => (
                  <button
                    key={rate}
                    className={`mode-card ${
                      state.canBus.bitrateKbps ===
                      rate
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setCanBusBitrate(
                        rate,
                      )
                    }
                  >
                    <strong>
                      {rate} KBPS
                    </strong>

                    <span>
                      CAN BUS RATE
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                LIVE CAN FRAMES:{"\u00A0"}
              </span>

              <strong>
                {state.canBus.frames.length}
              </strong>
            </div>

            {state.canBus.frames.length ===
            0 ? (
              <div className="logger-empty">
                No CAN frames recorded yet.
              </div>
            ) : (
              <div className="fault-history">
                {state.canBus.frames
                  .slice(-20)
                  .reverse()
                  .map(
                    (
                      frame,
                      index,
                    ) => (
                      <div
                        key={`${frame.id}-${frame.timestampMs}-${index}`}
                        className="fault-history-item"
                      >
                        <span>
                          {frame.id}
                          {" · "}
                          {frame.name}
                          {" · "}
                          {frame.frequencyHz}Hz
                          {" · "}
                          [
                          {frame.data
                            .map(
                              (byte) =>
                                byte
                                  .toString(16)
                                  .padStart(
                                    2,
                                    "0",
                                  )
                                  .toUpperCase(),
                            )
                            .join(" ")}
                          ]
                        </span>
                      </div>
                    ),
                  )}
              </div>
            )}
          </div>
        </section>

        <section className={workspaceClass(
            "tuning",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                PROTECTION CALIBRATION
              </span>

              <h2>
                Protection Thresholds
              </h2>

              <p className="profile-description">
                Configure simulated safety thresholds
                for coolant, oil pressure, boost, AFR,
                rev protection, knock sensitivity and
                thermal limits.
              </p>
            </div>

            <button
              className="logger-button"
              onClick={
                resetProtectionSettings
              }
            >
              RESET DEFAULTS
            </button>
          </div>

          <div className="protection-settings-grid">
            <ProtectionInput
              label="COOLANT WARNING"
              value={
                state.protectionSettings
                  .coolantWarningC
              }
              min={80}
              max={120}
              step={1}
              unit="°C"
              onChange={(value) =>
                updateProtectionSetting(
                  "coolantWarningC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="COOLANT CRITICAL"
              value={
                state.protectionSettings
                  .coolantCriticalC
              }
              min={90}
              max={130}
              step={1}
              unit="°C"
              onChange={(value) =>
                updateProtectionSetting(
                  "coolantCriticalC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="MIN OIL PRESSURE"
              value={
                state.protectionSettings
                  .minimumOilPressureKpa
              }
              min={20}
              max={400}
              step={5}
              unit="KPA"
              onChange={(value) =>
                updateProtectionSetting(
                  "minimumOilPressureKpa",
                  value,
                )
              }
            />

            <ProtectionInput
              label="OIL RPM THRESHOLD"
              value={
                state.protectionSettings
                  .lowOilPressureRpmThreshold
              }
              min={500}
              max={5000}
              step={100}
              unit="RPM"
              onChange={(value) =>
                updateProtectionSetting(
                  "lowOilPressureRpmThreshold",
                  value,
                )
              }
            />

            <ProtectionInput
              label="BOOST WARNING"
              value={
                state.protectionSettings
                  .boostWarningBar
              }
              min={0.2}
              max={3.5}
              step={0.1}
              unit="BAR"
              onChange={(value) =>
                updateProtectionSetting(
                  "boostWarningBar",
                  value,
                )
              }
            />

            <ProtectionInput
              label="BOOST CUT"
              value={
                state.protectionSettings
                  .boostCutBar
              }
              min={0.3}
              max={4}
              step={0.1}
              unit="BAR"
              onChange={(value) =>
                updateProtectionSetting(
                  "boostCutBar",
                  value,
                )
              }
            />

            <ProtectionInput
              label="LEAN AFR LIMIT"
              value={
                state.protectionSettings
                  .leanAfrLimit
              }
              min={13}
              max={20}
              step={0.1}
              unit="AFR"
              onChange={(value) =>
                updateProtectionSetting(
                  "leanAfrLimit",
                  value,
                )
              }
            />

            <ProtectionInput
              label="RICH AFR LIMIT"
              value={
                state.protectionSettings
                  .richAfrLimit
              }
              min={8}
              max={14}
              step={0.1}
              unit="AFR"
              onChange={(value) =>
                updateProtectionSetting(
                  "richAfrLimit",
                  value,
                )
              }
            />

            <ProtectionInput
              label="KNOCK SENSITIVITY"
              value={
                state.protectionSettings
                  .knockSensitivity
              }
              min={0.5}
              max={2}
              step={0.05}
              unit="x"
              onChange={(value) =>
                updateProtectionSetting(
                  "knockSensitivity",
                  value,
                )
              }
            />

            <ProtectionInput
              label="MAX REV MULTIPLIER"
              value={
                state.protectionSettings
                  .maximumRevMultiplier
              }
              min={0.8}
              max={1.2}
              step={0.01}
              unit="x"
              onChange={(value) =>
                updateProtectionSetting(
                  "maximumRevMultiplier",
                  value,
                )
              }
            />

            <ProtectionInput
              label="ALS MAX COOLANT"
              value={
                state.protectionSettings
                  .antiLagMaxCoolantC
              }
              min={80}
              max={120}
              step={1}
              unit="°C"
              onChange={(value) =>
                updateProtectionSetting(
                  "antiLagMaxCoolantC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="ALS MAX IAT"
              value={
                state.protectionSettings
                  .antiLagMaxIatC
              }
              min={40}
              max={100}
              step={1}
              unit="°C"
              onChange={(value) =>
                updateProtectionSetting(
                  "antiLagMaxIatC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="BRAKE BOOST MAX COOLANT"
              value={
                state.protectionSettings
                  .brakeBoostMaxCoolantC
              }
              min={80}
              max={120}
              step={1}
              unit="°C"
              onChange={(value) =>
                updateProtectionSetting(
                  "brakeBoostMaxCoolantC",
                  value,
                )
              }
            />

            <ProtectionInput
              label="BRAKE BOOST MAX IAT"
              value={
                state.protectionSettings
                  .brakeBoostMaxIatC
              }
              min={40}
              max={100}
              step={1}
              unit="°C"
              onChange={(value) =>
                updateProtectionSetting(
                  "brakeBoostMaxIatC",
                  value,
                )
              }
            />
          </div>
        </section>

        <section className={workspaceClass(
            "diagnostics",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ADVANCED DIAGNOSTICS
              </span>

              <h2>
                Advanced DTC Manager
              </h2>

              <p className="profile-description">
                Tracks pending, current and stored
                diagnostic trouble codes with severity,
                occurrence count and freeze-frame data.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.diagnostics.milActive
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.diagnostics.milActive
                    ? "online"
                    : ""
                }`}
              />

              {state.diagnostics.milActive
                ? "MIL ON"
                : state.diagnostics.all.length >
                    0
                  ? "DTC STORED"
                  : "CLEAR"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="CURRENT"
              value={`${state.diagnostics.current.length}`}
            />

            <LambdaValue
              label="PENDING"
              value={`${state.diagnostics.pending.length}`}
            />

            <LambdaValue
              label="STORED"
              value={`${state.diagnostics.stored.length}`}
            />

            <LambdaValue
              label="MIL"
              value={
                state.diagnostics.milActive
                  ? "ON"
                  : "OFF"
              }
            />
          </div>

          <button
            className="logger-button"
            onClick={
              clearDtcs
            }
          >
            CLEAR DTCs
          </button>

          {state.diagnostics.all.length ===
          0 ? (
            <div className="logger-empty">
              No diagnostic trouble codes stored.
            </div>
          ) : (
            <div className="dtc-manager-list">
              {state.diagnostics.all.map(
                (record) => (
                  <DtcCard
                    key={record.code}
                    record={record}
                  />
                ),
              )}
            </div>
          )}
        </section>

        <section className={workspaceClass(
            "diagnostics",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                DIAGNOSTIC SIMULATION
              </span>

              <h2>
                Sensor Fault Injection
              </h2>

              <p className="profile-description">
                Inject simulated sensor failures to
                test fallback values, DTC generation,
                torque reduction and limp-mode
                behavior.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.sensorFaults.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.sensorFaults.active
                    ? "online"
                    : ""
                }`}
              />

              {state.sensorFaults.limpModeRequested
                ? "LIMP MODE"
                : state.sensorFaults.active
                  ? "FAULT ACTIVE"
                  : "CLEAR"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="ACTIVE FAULTS"
              value={`${state.sensorFaults.activeFaults.length}`}
            />

            <LambdaValue
              label="DTC COUNT"
              value={`${state.sensorFaults.dtcs.length}`}
            />

            <LambdaValue
              label="TORQUE ALLOWANCE"
              value={`${Math.round(
                state.sensorFaults.torqueMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="BOOST ALLOWANCE"
              value={`${Math.round(
                state.sensorFaults.boostMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="LIMP MODE"
              value={
                state.sensorFaults.limpModeRequested
                  ? "REQUESTED"
                  : "OFF"
              }
            />
          </div>

          <div className="mode-grid">
            {[
              ["map", "MAP SENSOR"],
              ["tps", "TPS SENSOR"],
              ["coolant", "COOLANT SENSOR"],
              ["iat", "IAT SENSOR"],
              ["wideband", "WIDEBAND O2"],
              ["oil-pressure", "OIL PRESSURE"],
              ["battery", "BATTERY VOLTAGE"],
            ].map(
              ([fault, label]) => {
                const typedFault =
                  fault as
                    SimulatedSensorFault;

                const active =
                  state.sensorFaults.activeFaults.includes(
                    typedFault,
                  );

                return (
                  <button
                    key={fault}
                    className={`mode-card ${
                      active
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      toggleSensorFault(
                        typedFault,
                      )
                    }
                  >
                    <strong>
                      {label}
                    </strong>

                    <span>
                      {active
                        ? "FAULT INJECTED"
                        : "NORMAL"}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                ACTIVE DTCs:{"\u00A0"}
              </span>

              <strong>
                {state.sensorFaults.dtcs.length}
              </strong>
            </div>

            {state.sensorFaults.dtcs.length ===
            0 ? (
              <div className="logger-empty">
                No simulated DTCs active.
              </div>
            ) : (
              <div className="fault-history">
                {state.sensorFaults.dtcs.map(
                  (dtc) => (
                    <div
                      key={dtc}
                      className="fault-history-item"
                    >
                      <AlertTriangle
                        size={16}
                      />

                      <span>
                        {dtc}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <button
            className="logger-button"
            onClick={
              clearSensorFaults
            }
          >
            CLEAR SENSOR FAULTS
          </button>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                PERFORMANCE ANALYSIS
              </span>

              <h2>
                Virtual Dyno
              </h2>

              <p className="profile-description">
                Simulated torque and power estimation
                based on RPM, engine load, displacement,
                aspiration and boost pressure.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.virtualDyno.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.virtualDyno.active
                    ? "online"
                    : ""
                }`}
              />

              {state.virtualDyno.active
                ? "LIVE"
                : "READY"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="TORQUE"
              value={`${state.virtualDyno.torqueNm.toFixed(
                0,
              )} NM`}
            />

            <LambdaValue
              label="POWER"
              value={`${state.virtualDyno.powerKw.toFixed(
                1,
              )} KW`}
            />

            <LambdaValue
              label="HORSEPOWER"
              value={`${state.virtualDyno.horsepower.toFixed(
                0,
              )} HP`}
            />

            <LambdaValue
              label="BOOST"
              value={`${state.virtualDyno.boostBar.toFixed(
                2,
              )} BAR`}
            />

            <LambdaValue
              label="PEAK TORQUE"
              value={`${state.virtualDyno.peakTorqueNm.toFixed(
                0,
              )} NM`}
            />

            <LambdaValue
              label="PEAK POWER"
              value={`${state.virtualDyno.peakHorsepower.toFixed(
                0,
              )} HP`}
            />
          </div>

          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  dynoChartData
                }
              >
                <XAxis
                  dataKey="rpm"
                  type="number"
                  domain={[
                    0,
                    Math.max(
                      8000,
                      profile.engine
                        .redlineRpm,
                    ),
                  ]}
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="torqueNm"
                  name="Torque Nm"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="horsepower"
                  name="Horsepower"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                TWO-PEDAL BOOST CONTROL
              </span>

              <h2>
                Brake Boost
              </h2>

              <p className="profile-description">
                Simulated brake-held boost building
                using ignition retard, additional fuel,
                boost hold and coordinated torque
                reduction before release.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.brakeBoost.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.brakeBoost.enabled
                    ? "online"
                    : ""
                }`}
              />

              {state.brakeBoost.thermalProtection
                ? "THERMAL PROTECTION"
                : state.brakeBoost.active
                  ? "BOOST BUILD"
                  : state.brakeBoost.armed
                    ? "ARMED"
                    : state.brakeBoost.enabled
                      ? "READY"
                      : "DISABLED"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SYSTEM"
              value={
                state.brakeBoost.enabled
                  ? "ENABLED"
                  : "DISABLED"
              }
            />

            <LambdaValue
              label="STATUS"
              value={state.brakeBoost.reason}
            />

            <LambdaValue
              label="BRAKE POSITION"
              value={`${state.brakeBoost.brakePosition.toFixed(
                0,
              )}%`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.brakeBoost.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="FUEL ENRICHMENT"
              value={`+${state.brakeBoost.fuelEnrichmentPercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="BOOST HOLD"
              value={`${state.brakeBoost.boostHoldMultiplier.toFixed(
                3,
              )}x`}
            />

            <LambdaValue
              label="TORQUE ALLOWANCE"
              value={`${Math.round(
                state.brakeBoost.torqueMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="THERMAL PROTECTION"
              value={
                state.brakeBoost.thermalProtection
                  ? "ACTIVE"
                  : "OK"
              }
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                BRAKE POSITION:{"\u00A0"}
              </span>

              <strong>
                {state.brakeBoost.brakePosition.toFixed(
                  0,
                )}
                %
              </strong>
            </div>

            <input
              className="throttle"
              type="range"
              min="0"
              max="100"
              step="1"
              value={
                state.brakeBoost.brakePosition
              }
              onChange={(event) =>
                setBrakePosition(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />

            <div className="throttle-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="control-grid">
            <button
              className={`engine-button ${
                state.brakeBoost.enabled
                  ? "stop"
                  : ""
              }`}
              onClick={() =>
                setBrakeBoostEnabled(
                  !state.brakeBoost.enabled,
                )
              }
            >
              {state.brakeBoost.enabled
                ? "DISABLE BRAKE BOOST"
                : "ENABLE BRAKE BOOST"}
            </button>

            <button
              className="engine-button"
              disabled={
                !state.brakeBoost.armed
              }
              onClick={
                releaseBrakeBoost
              }
            >
              RELEASE BRAKE BOOST
            </button>
          </div>

          <div className="lambda-conditions">
            <ConditionRow
              label="ENGINE"
              passed={
                engineRunning
              }
              value={
                engineRunning
                  ? "RUNNING"
                  : "STOPPED"
              }
            />

            <ConditionRow
              label="RPM"
              passed={
                state.sensors.rpm >=
                2200
              }
              value={`${Math.round(
                state.sensors.rpm,
              )} / 2200 RPM`}
            />

            <ConditionRow
              label="THROTTLE"
              passed={
                state.sensors
                  .throttlePosition >=
                55
              }
              value={`${state.sensors.throttlePosition.toFixed(
                1,
              )}% / 55%`}
            />

            <ConditionRow
              label="BRAKE"
              passed={
                state.brakeBoost
                  .brakePosition >=
                40
              }
              value={`${state.brakeBoost.brakePosition.toFixed(
                0,
              )}% / 40%`}
            />

            <ConditionRow
              label="SPEED"
              passed={
                state.sensors
                  .vehicleSpeedKph <=
                20
              }
              value={`${state.sensors.vehicleSpeedKph.toFixed(
                0,
              )} / 20 KM/H`}
            />

            <ConditionRow
              label="TEMPERATURES"
              passed={
                !state.brakeBoost
                  .thermalProtection
              }
              value={
                state.brakeBoost
                  .thermalProtection
                  ? "PROTECTION ACTIVE"
                  : "OK"
              }
            />
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ROLLING LAUNCH CONTROL
              </span>

              <h2>
                Rolling Launch / Rolling Anti-Lag
              </h2>

              <p className="profile-description">
                Hold a target rolling speed while
                building boost, then release into the
                active torque and traction strategy.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.rollingLaunch.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.rollingLaunch.enabled
                    ? "online"
                    : ""
                }`}
              />

              {state.rollingLaunch.active
                ? "BOOST BUILD"
                : state.rollingLaunch.armed
                  ? "ARMED"
                  : state.rollingLaunch.enabled
                    ? "READY"
                    : "DISABLED"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SYSTEM"
              value={
                state.rollingLaunch.enabled
                  ? "ENABLED"
                  : "DISABLED"
              }
            />

            <LambdaValue
              label="STATUS"
              value={state.rollingLaunch.reason}
            />

            <LambdaValue
              label="TARGET SPEED"
              value={`${state.rollingLaunch.targetSpeedKph.toFixed(
                0,
              )} KM/H`}
            />

            <LambdaValue
              label="CURRENT SPEED"
              value={`${state.sensors.vehicleSpeedKph.toFixed(
                0,
              )} KM/H`}
            />

            <LambdaValue
              label="SPEED ERROR"
              value={`${state.rollingLaunch.speedErrorKph.toFixed(
                1,
              )} KM/H`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.rollingLaunch.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="FUEL ENRICHMENT"
              value={`+${state.rollingLaunch.fuelEnrichmentPercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="BOOST HOLD"
              value={`${state.rollingLaunch.boostHoldMultiplier.toFixed(
                3,
              )}x`}
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                ROLLING TARGET SPEED:{"\u00A0"}
              </span>

              <strong>
                {state.rollingLaunch.targetSpeedKph.toFixed(
                  0,
                )}
                {" "}KM/H
              </strong>
            </div>

            <input
              className="throttle"
              type="range"
              min="20"
              max="200"
              step="1"
              value={
                state.rollingLaunch.targetSpeedKph
              }
              onChange={(event) =>
                setRollingLaunchTargetSpeed(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />

            <div className="throttle-labels">
              <span>20 KM/H</span>
              <span>110 KM/H</span>
              <span>200 KM/H</span>
            </div>
          </div>

          <div className="control-grid">
            <button
              className={`engine-button ${
                state.rollingLaunch.enabled
                  ? "stop"
                  : ""
              }`}
              onClick={() =>
                setRollingLaunchEnabled(
                  !state.rollingLaunch.enabled,
                )
              }
            >
              {state.rollingLaunch.enabled
                ? "DISABLE ROLLING LAUNCH"
                : "ENABLE ROLLING LAUNCH"}
            </button>

            <button
              className="engine-button"
              disabled={
                !state.rollingLaunch.armed
              }
              onClick={
                releaseRollingLaunch
              }
            >
              RELEASE
            </button>
          </div>

          <div className="lambda-conditions">
            <ConditionRow
              label="ENGINE"
              passed={
                engineRunning
              }
              value={
                engineRunning
                  ? "RUNNING"
                  : "STOPPED"
              }
            />

            <ConditionRow
              label="RPM"
              passed={
                state.sensors.rpm >=
                2500
              }
              value={`${Math.round(
                state.sensors.rpm,
              )} / 2500 RPM`}
            />

            <ConditionRow
              label="THROTTLE"
              passed={
                state.sensors
                  .throttlePosition >=
                55
              }
              value={`${state.sensors.throttlePosition.toFixed(
                1,
              )}% / 55%`}
            />

            <ConditionRow
              label="TARGET SPEED WINDOW"
              passed={
                Math.abs(
                  state.rollingLaunch.speedErrorKph,
                ) <=
                4
              }
              value={`${state.rollingLaunch.speedErrorKph.toFixed(
                1,
              )} KM/H`}
            />
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                TORQUE COORDINATION
              </span>

              <h2>
                Torque Management
              </h2>

              <p className="profile-description">
                Unified torque arbitration across
                traction control, shifting, launch
                control, pit limiter, boost-by-gear,
                anti-lag and engine protection.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.torqueManagement.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.torqueManagement.active
                    ? "online"
                    : ""
                }`}
              />

              {state.torqueManagement.active
                ? "INTERVENING"
                : "READY"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="REQUESTED TORQUE"
              value={`${state.torqueManagement.requestedTorquePercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="DELIVERED TORQUE"
              value={`${state.torqueManagement.deliveredTorquePercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="THROTTLE ALLOWANCE"
              value={`${Math.round(
                state.torqueManagement.throttleMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.torqueManagement.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="BOOST ALLOWANCE"
              value={`${Math.round(
                state.torqueManagement.boostMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                state.torqueManagement.fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                DOMINANT TORQUE REQUEST:{"\u00A0"}
              </span>

              <strong>
                {state.torqueManagement.dominantReason}
              </strong>
            </div>

            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      state.torqueManagement.deliveredTorquePercent,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                TRANSMISSION CONTROL
              </span>

              <h2>
                Automatic Gear Detection
              </h2>

              <p className="profile-description">
                Simulated automatic shifting based on
                RPM, throttle and vehicle speed. The
                detected gear feeds Boost-by-Gear
                automatically.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.transmission
                  .shiftOccurred
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.transmission.enabled
                    ? "online"
                    : ""
                }`}
              />

              {state.transmission.shiftOccurred
                ? state.transmission.shiftUpRequested
                  ? "SHIFT UP"
                  : "SHIFT DOWN"
                : state.transmission.enabled
                  ? "AUTO"
                  : "MANUAL"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="MODE"
              value={
                state.transmission.enabled
                  ? "AUTOMATIC"
                  : "MANUAL"
              }
            />

            <LambdaValue
              label="CURRENT GEAR"
              value={`${state.transmission.currentGear}`}
            />

            <LambdaValue
              label="PREVIOUS GEAR"
              value={`${state.transmission.previousGear}`}
            />

            <LambdaValue
              label="SHIFT STATUS"
              value={state.transmission.reason}
            />

            <LambdaValue
              label="SHIFT TIMER"
              value={`${state.transmission.elapsedSinceShiftMs.toFixed(
                0,
              )} ms`}
            />

            <LambdaValue
              label="VEHICLE SPEED"
              value={`${state.sensors.vehicleSpeedKph.toFixed(
                0,
              )} KM/H`}
            />
          </div>

          <button
            className={`engine-button ${
              state.transmission.enabled
                ? "stop"
                : ""
            }`}
            onClick={() =>
              setTransmissionEnabled(
                !state.transmission.enabled,
              )
            }
          >
            {state.transmission.enabled
              ? "DISABLE AUTOMATIC SHIFTING"
              : "ENABLE AUTOMATIC SHIFTING"}
          </button>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                BOOST STRATEGY
              </span>

              <h2>
                Boost-by-Gear
              </h2>

              <p className="profile-description">
                Simulated gear-based boost control for
                reducing torque in lower gears and
                progressively allowing full boost in
                higher gears.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.boostByGear.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.boostByGear.active
                    ? "online"
                    : ""
                }`}
              />

              {state.boostByGear.active
                ? "LIMITING"
                : state.boostByGear.enabled
                  ? "ACTIVE"
                  : "DISABLED"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SYSTEM"
              value={
                state.boostByGear.enabled
                  ? "ENABLED"
                  : "DISABLED"
              }
            />

            <LambdaValue
              label="CURRENT GEAR"
              value={`${state.boostByGear.currentGear}`}
            />

            <LambdaValue
              label="GEAR MULTIPLIER"
              value={`${Math.round(
                state.boostByGear.multiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="BASE BOOST DUTY"
              value={`${state.boostByGear.baseBoostControlDuty.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="LIMITED BOOST DUTY"
              value={`${state.boostByGear.limitedBoostControlDuty.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="STATUS"
              value={state.boostByGear.reason}
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                CURRENT GEAR:{"\u00A0"}
              </span>

              <strong>
                GEAR {state.boostByGear.currentGear}
              </strong>
            </div>

            <div className="mode-grid">
              {[1, 2, 3, 4, 5, 6].map(
                (gear) => (
                  <button
                    key={gear}
                    className={`mode-card ${
                      state.boostByGear.currentGear ===
                      gear
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setCurrentGear(
                        gear,
                      )
                    }
                  >
                    <strong>
                      GEAR {gear}
                    </strong>

                    <span>
                      {Math.round(
                        boostByGearMultipliers[
                          gear
                        ] *
                          100,
                      )}
                      % BOOST
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                GEAR BOOST LIMITS:{"\u00A0"}
              </span>

              <strong>
                CONFIGURATION
              </strong>
            </div>

            {[1, 2, 3, 4, 5, 6].map(
              (gear) => (
                <div
                  key={gear}
                  className="control"
                >
                  <div className="lambda-trim-header">
                    <span>
                      GEAR {gear}:{"\u00A0"}
                    </span>

                    <strong>
                      {Math.round(
                        boostByGearMultipliers[
                          gear
                        ] *
                          100,
                      )}
                      %
                    </strong>
                  </div>

                  <input
                    className="throttle"
                    type="range"
                    min="0"
                    max="125"
                    step="1"
                    value={
                      boostByGearMultipliers[
                        gear
                      ] *
                      100
                    }
                    onChange={(event) =>
                      setGearBoostMultiplier(
                        gear,
                        Number(
                          event.target.value,
                        ) / 100,
                      )
                    }
                  />
                </div>
              ),
            )}
          </div>

          <button
            className={`engine-button ${
              state.boostByGear.enabled
                ? "stop"
                : ""
            }`}
            onClick={() =>
              setBoostByGearEnabled(
                !state.boostByGear.enabled,
              )
            }
          >
            {state.boostByGear.enabled
              ? "DISABLE BOOST-BY-GEAR"
              : "ENABLE BOOST-BY-GEAR"}
          </button>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                SPEED CONTROL
              </span>

              <h2>
                Pit Limiter
              </h2>

              <p className="profile-description">
                Simulated pit-lane speed control using
                progressive ignition retard, boost
                reduction and hard fuel cut.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.pitLimiter.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.pitLimiter.active
                    ? "online"
                    : ""
                }`}
              />

              {state.pitLimiter.hardCutActive
                ? "HARD CUT"
                : state.pitLimiter.active
                  ? "LIMITING"
                  : state.pitLimiter.enabled
                    ? "ARMED"
                    : "DISABLED"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SYSTEM"
              value={
                state.pitLimiter.enabled
                  ? "ENABLED"
                  : "DISABLED"
              }
            />

            <LambdaValue
              label="STATUS"
              value={state.pitLimiter.reason}
            />

            <LambdaValue
              label="TARGET SPEED"
              value={`${state.pitLimiter.targetSpeedKph.toFixed(
                0,
              )} KM/H`}
            />

            <LambdaValue
              label="CURRENT SPEED"
              value={`${state.sensors.vehicleSpeedKph.toFixed(
                0,
              )} KM/H`}
            />

            <LambdaValue
              label="SPEED ERROR"
              value={`${state.pitLimiter.speedErrorKph.toFixed(
                1,
              )} KM/H`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.pitLimiter.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="BOOST ALLOWANCE"
              value={`${Math.round(
                state.pitLimiter.boostMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                state.pitLimiter.fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                PIT SPEED TARGET:{"\u00A0"}
              </span>

              <strong>
                {state.pitLimiter.targetSpeedKph.toFixed(
                  0,
                )}
                {" "}KM/H
              </strong>
            </div>

            <input
              className="throttle"
              type="range"
              min="20"
              max="120"
              step="1"
              value={
                state.pitLimiter.targetSpeedKph
              }
              onChange={(event) =>
                setPitLimiterTargetSpeed(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />

            <div className="throttle-labels">
              <span>20 KM/H</span>
              <span>70 KM/H</span>
              <span>120 KM/H</span>
            </div>
          </div>

          <button
            className={`engine-button ${
              state.pitLimiter.enabled
                ? "stop"
                : ""
            }`}
            onClick={() =>
              setPitLimiterEnabled(
                !state.pitLimiter.enabled,
              )
            }
          >
            {state.pitLimiter.enabled
              ? "DISABLE PIT LIMITER"
              : "ENABLE PIT LIMITER"}
          </button>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                SHIFT CONTROL
              </span>

              <h2>
                Flat-Foot / No-Lift Shift
              </h2>

              <p className="profile-description">
                Simulated high-throttle shift strategy
                using ignition retard, optional fuel
                cut and boost hold during gear changes.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.noLiftShift.active ||
                state.noLiftShift.recovering
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.noLiftShift.active ||
                  state.noLiftShift.recovering
                    ? "online"
                    : ""
                }`}
              />

              {state.noLiftShift.active
                ? "SHIFT CUT"
                : state.noLiftShift.recovering
                  ? "RECOVERY"
                  : state.noLiftShift.armed
                    ? "ARMED"
                    : state.noLiftShift.enabled
                      ? "READY"
                      : "DISABLED"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SYSTEM"
              value={
                state.noLiftShift.enabled
                  ? "ENABLED"
                  : "DISABLED"
              }
            />

            <LambdaValue
              label="STATUS"
              value={state.noLiftShift.reason}
            />

            <LambdaValue
              label="SHIFT TIMER"
              value={`${state.noLiftShift.timerMs.toFixed(
                0,
              )} ms`}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.noLiftShift.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="BOOST HOLD"
              value={`${state.noLiftShift.boostHoldMultiplier.toFixed(
                3,
              )}x`}
            />

            <LambdaValue
              label="FUEL CUT"
              value={
                state.noLiftShift.fuelCut
                  ? "ACTIVE"
                  : "OFF"
              }
            />
          </div>

          <div className="control-grid">
            <button
              className={`engine-button ${
                state.noLiftShift.enabled
                  ? "stop"
                  : ""
              }`}
              onClick={() =>
                setNoLiftShiftEnabled(
                  !state.noLiftShift.enabled,
                )
              }
            >
              {state.noLiftShift.enabled
                ? "DISABLE NO-LIFT SHIFT"
                : "ENABLE NO-LIFT SHIFT"}
            </button>

            <button
              className="engine-button"
              disabled={
                !state.noLiftShift.enabled ||
                !state.noLiftShift.armed
              }
              onClick={
                triggerNoLiftShift
              }
            >
              SIMULATE SHIFT
            </button>
          </div>

          <div className="lambda-conditions">
            <ConditionRow
              label="ENGINE"
              passed={
                engineRunning
              }
              value={
                engineRunning
                  ? "RUNNING"
                  : "STOPPED"
              }
            />

            <ConditionRow
              label="RPM"
              passed={
                state.sensors.rpm >=
                3000
              }
              value={`${Math.round(
                state.sensors.rpm,
              )} / 3000 RPM`}
            />

            <ConditionRow
              label="THROTTLE"
              passed={
                state.sensors
                  .throttlePosition >=
                70
              }
              value={`${state.sensors.throttlePosition.toFixed(
                1,
              )}% / 70%`}
            />

            <ConditionRow
              label="VEHICLE SPEED"
              passed={
                state.sensors
                  .vehicleSpeedKph >
                5
              }
              value={`${state.sensors.vehicleSpeedKph.toFixed(
                0,
              )} / 5 KM/H`}
            />
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                TURBO RESPONSE CONTROL
              </span>

              <h2>
                Anti-Lag Control
              </h2>

              <p className="profile-description">
                Simulated anti-lag strategy using
                ignition retard, additional fuel and
                boost-hold intervention with thermal
                protection.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.antiLag.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.antiLag.active
                    ? "online"
                    : ""
                }`}
              />

              {state.antiLag.thermalProtection
                ? "THERMAL PROTECTION"
                : state.antiLag.active
                  ? "ANTI-LAG ACTIVE"
                  : state.antiLag.enabled
                    ? "ARMED"
                    : "DISABLED"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SYSTEM"
              value={
                state.antiLag.enabled
                  ? "ENABLED"
                  : "DISABLED"
              }
            />

            <LambdaValue
              label="STATUS"
              value={state.antiLag.reason}
            />

            <LambdaValue
              label="IGNITION RETARD"
              value={`${state.antiLag.ignitionRetardDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="FUEL ENRICHMENT"
              value={`+${state.antiLag.fuelEnrichmentPercent.toFixed(
                1,
              )}%`}
            />

            <LambdaValue
              label="BOOST HOLD"
              value={`${state.antiLag.boostHoldMultiplier.toFixed(
                3,
              )}x`}
            />

            <LambdaValue
              label="THERMAL PROTECTION"
              value={
                state.antiLag.thermalProtection
                  ? "ACTIVE"
                  : "OK"
              }
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                ANTI-LAG ENABLE:{"\u00A0"}
              </span>

              <strong>
                {state.antiLag.enabled
                  ? "ON"
                  : "OFF"}
              </strong>
            </div>

            <button
              className={`engine-button ${
                state.antiLag.enabled
                  ? "stop"
                  : ""
              }`}
              onClick={() =>
                setAntiLagEnabled(
                  !state.antiLag.enabled,
                )
              }
            >
              {state.antiLag.enabled
                ? "DISABLE ANTI-LAG"
                : "ENABLE ANTI-LAG"}
            </button>
          </div>

          <div className="lambda-conditions">
            <ConditionRow
              label="ENGINE"
              passed={
                engineRunning
              }
              value={
                engineRunning
                  ? "RUNNING"
                  : "STOPPED"
              }
            />

            <ConditionRow
              label="RPM"
              passed={
                state.sensors.rpm >=
                2500
              }
              value={`${Math.round(
                state.sensors.rpm,
              )} / 2500 RPM`}
            />

            <ConditionRow
              label="THROTTLE"
              passed={
                state.sensors
                  .throttlePosition >=
                  5 &&
                state.sensors
                  .throttlePosition <=
                  35
              }
              value={`${state.sensors.throttlePosition.toFixed(
                1,
              )}% / 5-35%`}
            />

            <ConditionRow
              label="COOLANT"
              passed={
                state.sensors
                  .coolantTemperatureC <
                105
              }
              value={`${state.sensors.coolantTemperatureC.toFixed(
                1,
              )} / 105°C`}
            />

            <ConditionRow
              label="IAT"
              passed={
                state.sensors
                  .intakeAirTemperatureC <
                70
              }
              value={`${state.sensors.intakeAirTemperatureC.toFixed(
                1,
              )} / 70°C`}
            />
          </div>
        </section>

        <section className={workspaceClass(
            "performance",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                FLEX FUEL CONTROL
              </span>

              <h2>
                Ethanol Compensation
              </h2>

              <p className="profile-description">
                Simulated ethanol-content sensing with
                automatic fuel, ignition and boost
                compensation from E0 to E85.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.flexFuel.active
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.flexFuel.active
                    ? "online"
                    : ""
                }`}
              />

              {state.flexFuel.active
                ? `E${Math.round(
                    state.flexFuel.ethanolPercent,
                  )} ACTIVE`
                : "PETROL"}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="ETHANOL CONTENT"
              value={`${state.flexFuel.ethanolPercent.toFixed(
                0,
              )}%`}
            />

            <LambdaValue
              label="FUEL MULTIPLIER"
              value={`${state.flexFuel.fuelMultiplier.toFixed(
                3,
              )}x`}
            />

            <LambdaValue
              label="FUEL COMPENSATION"
              value={`${(
                state.flexFuel.fuelMultiplier *
                  100 -
                100
              ).toFixed(1)}%`}
            />

            <LambdaValue
              label="IGNITION ADVANCE"
              value={`+${state.flexFuel.ignitionAdvanceDegrees.toFixed(
                1,
              )}°`}
            />

            <LambdaValue
              label="BOOST MULTIPLIER"
              value={`${state.flexFuel.boostMultiplier.toFixed(
                3,
              )}x`}
            />

            <LambdaValue
              label="EST. STOICH AFR"
              value={state.flexFuel.estimatedStoichAfr.toFixed(
                2,
              )}
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-header">
              <span>
                ETHANOL CONTENT:{"\u00A0"}
              </span>

              <strong>
                E
                {Math.round(
                  state.flexFuel.ethanolPercent,
                )}
              </strong>
            </div>

            <input
              className="throttle"
              type="range"
              min="0"
              max="85"
              step="1"
              value={
                state.flexFuel.ethanolPercent
              }
              onChange={(event) =>
                setEthanolContent(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />

            <div className="throttle-labels">
              <span>E0</span>
              <span>E42</span>
              <span>E85</span>
            </div>
          </div>
        </section>

                <section
          className={workspaceClass(
            "setup",
            "panel",
          )}
        >
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                V1.1 TEST AUTOMATION
              </span>

              <h2>
                Test Bench / Scenario Runner
              </h2>

              <p className="profile-description">
                Run repeatable ECU simulation scenarios
                using the same engine, protection,
                diagnostics, torque and CAN systems as
                normal operation.
              </p>
            </div>

            <div
              className={`lambda-status ${
                state.testBench.running
                  ? "active"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  state.testBench.running
                    ? "online"
                    : ""
                }`}
              />

              {state.testBench.status}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="SCENARIO"
              value={
                state.testBench.scenarioName
              }
            />

            <LambdaValue
              label="STATUS"
              value={
                state.testBench.status
              }
            />

            <LambdaValue
              label="ELAPSED"
              value={`${state.testBench.elapsedSeconds.toFixed(
                1,
              )} S`}
            />

            <LambdaValue
              label="DURATION"
              value={`${state.testBench.durationSeconds.toFixed(
                0,
              )} S`}
            />

            <LambdaValue
              label="PROGRESS"
              value={`${state.testBench.progressPercent.toFixed(
                0,
              )}%`}
            />

            <LambdaValue
              label="COMPLETED RUNS"
              value={`${state.testBench.completedRuns}`}
            />
          </div>

          <div className="lambda-trim-section">
            <div className="lambda-trim-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${state.testBench.progressPercent}%`,
                }}
              />
            </div>
          </div>

          <div className="mode-grid">
            {testBenchScenarios.map(
              (scenario) => (
                <button
                  key={scenario.id}
                  className={`mode-card ${
                    state.testBench.scenarioId ===
                      scenario.id
                      ? "active"
                      : ""
                  }`}
                  disabled={
                    state.testBench.running
                  }
                  onClick={() =>
                    startTestBenchScenario(
                      scenario.id,
                    )
                  }
                >
                  <strong>
                    {scenario.name}
                  </strong>

                  <span>
                    {scenario.description}
                  </span>
                </button>
              ),
            )}
          </div>

          <button
            className="logger-button"
            disabled={
              !state.testBench.running
            }
            onClick={
              stopTestBenchScenario
            }
          >
            STOP TEST
          </button>
        </section>

<section className={workspaceClass(
            "setup",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                DRIVE MODE TORQUE MAP
              </span>

              <h2>
                {activeMode.name} Torque Strategy
              </h2>

              <p className="profile-description">
                Mode-specific torque delivery controlling
                throttle authority, boost allowance,
                ignition bias, launch aggression and
                traction intervention.
              </p>
            </div>

            <div className="lambda-status active">
              <span className="status-dot online" />
              {activeMode.name.toUpperCase()}
            </div>
          </div>

          <div className="lambda-grid">
            <LambdaValue
              label="TORQUE MULTIPLIER"
              value={`${Math.round(
                state.driveModeTorque.torqueMultiplier *
                  100,
              )}%`}
            />

            <LambdaValue
              label="THROTTLE AUTHORITY"
              value={`${Math.round(
                state.driveModeTorque.throttleAuthority *
                  100,
              )}%`}
            />

            <LambdaValue
              label="BOOST ALLOWANCE"
              value={`${Math.round(
                state.driveModeTorque.boostAllowance *
                  100,
              )}%`}
            />

            <LambdaValue
              label="IGNITION BIAS"
              value={`${formatSigned(
                state.driveModeTorque.ignitionBiasDegrees,
                1,
                "°",
              )}`}
            />

            <LambdaValue
              label="LAUNCH BIAS"
              value={`${Math.round(
                state.driveModeTorque.launchBias *
                  100,
              )}%`}
            />

            <LambdaValue
              label="TRACTION BIAS"
              value={`${Math.round(
                state.driveModeTorque.tractionBias *
                  100,
              )}%`}
            />
          </div>
        </section>

        <section className={workspaceClass(
            "setup",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ECU OPERATING MODE
              </span>

              <h2>
                {activeMode.name}
              </h2>

              <p className="profile-description">
                {activeMode.description}
              </p>
            </div>
          </div>

          <div className="mode-grid">
            {(
              Object.values(
                ecuModes,
              ) as typeof ecuModes[
                EcuMode
              ][]
            ).map((mode) => (
              <button
                key={mode.id}
                className={`mode-card ${
                  state.mode ===
                  mode.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  changeMode(
                    mode.id,
                  )
                }
              >
                <strong>
                  {mode.name}
                </strong>

                <span>
                  {mode.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className={workspaceClass(
            "setup",
            "panel profile-panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                VEHICLE PROFILE
              </span>

              <h2>
                {profile.name}
              </h2>

              <p className="profile-description">
                {profile.description}
              </p>
            </div>

            <select
              value={
                selectedProfileId
              }
              onChange={(event) =>
                changeProfile(
                  event.target.value,
                )
              }
            >
              {vehicleProfiles.map(
                (vehicle) => (
                  <option
                    key={
                      vehicle.id
                    }
                    value={
                      vehicle.id
                    }
                  >
                    {vehicle.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="profile-specs">
            <ProfileSpec
              label="ENGINE"
              value={`${profile.engine.cylinders} CYL`}
            />

            <ProfileSpec
              label="DISPLACEMENT"
              value={`${profile.engine.displacementLitres.toFixed(
                1,
              )} L`}
            />

            <ProfileSpec
              label="ASPIRATION"
              value={formatAspiration(
                profile.engine
                  .aspiration,
              )}
            />

            <ProfileSpec
              label="REDLINE"
              value={`${profile.engine.redlineRpm.toLocaleString()} RPM`}
            />

            <ProfileSpec
              label="FUEL"
              value={formatFuel(
                profile.engine
                  .fuelType,
              )}
            />
          </div>
        </section>

        <section
          className={workspaceClass(
            "overview",
            "stats-grid",
          )}
        >
          <Stat
            icon={<Gauge />}
            label="RPM"
            value={Math.round(
              state.sensors.rpm,
            ).toLocaleString()}
            unit="rpm"
          />

          <Stat
            icon={<Activity />}
            label="MAP"
            value={state.sensors.manifoldPressureKpa.toFixed(
              1,
            )}
            unit="kPa"
          />

          <Stat
            icon={<Thermometer />}
            label="COOLANT"
            value={state.sensors.coolantTemperatureC.toFixed(
              1,
            )}
            unit="°C"
          />

          <Stat
            icon={<Zap />}
            label="AFR"
            value={state.sensors.airFuelRatio.toFixed(
              2,
            )}
            unit=""
          />

          <Stat
            icon={<Activity />}
            label="OIL PRESSURE"
            value={state.sensors.oilPressureKpa.toFixed(
              1,
            )}
            unit="kPa"
          />

          <Stat
            icon={<Battery />}
            label="BATTERY"
            value={state.sensors.batteryVoltage.toFixed(
              2,
            )}
            unit="V"
          />
        </section>

        <section
          className={workspaceClass(
            "overview",
            "grid",
          )}
        >
          <div className="panel graph-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  LIVE DATA
                </span>

                <h2>
                  Engine RPM
                </h2>
              </div>
            </div>

            <div className="chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={
                    chartData
                  }
                >
                  <XAxis
                    dataKey="time"
                    hide
                  />

                  <YAxis
                    domain={[
                      0,
                      Math.max(
                        8000,
                        profile.engine
                          .redlineRpm,
                      ),
                    ]}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="rpm"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  ENGINE CONTROL
                </span>

                <h2>
                  Throttle
                </h2>
              </div>

              <span className="throttle-value">
                {Math.round(
                  state.sensors
                    .throttlePosition,
                )}
                %
              </span>
            </div>

            <input
              className="throttle"
              type="range"
              min="0"
              max="100"
              value={
                state.sensors
                  .throttlePosition
              }
              onChange={(event) =>
                setThrottle(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />

            <div className="control-grid">
              <Control
                label="Engine Load"
                value={`${Math.round(
                  state.sensors
                    .engineLoad *
                    100,
                )}%`}
              />

              <Control
                label="Injector PW"
                value={`${state.outputs.injectorPulseWidthMs.toFixed(
                  2,
                )} ms`}
              />

              <Control
                label="Ignition"
                value={`${state.outputs.ignitionTimingDegrees.toFixed(
                  1,
                )}°`}
              />

              <Control
                label="Boost Control"
                value={`${Math.round(
                  state.outputs
                    .boostControlDuty,
                )}%`}
              />
            </div>
          </div>
        </section>

        <div
          className={
            activeWorkspace ===
            "overview"
              ? "workspace-logger workspace-visible"
              : "workspace-hidden"
          }
        >
          <DataLogger
            samples={
              logSamples
            }
            recording={
              logging
            }
            onStart={
              startLogging
            }
            onStop={
              stopLogging
            }
            onClear={
              clearLogging
            }
            onExport={
              exportLogging
            }
            onInspectSample={
              inspectLogSampleInMap
            }
          />
        </div>

        <section className={workspaceClass(
            "diagnostics",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                DIAGNOSTIC HISTORY
              </span>

              <h2>
                Fault History
              </h2>
            </div>

            <button
              className="logger-button"
              onClick={
                clearFaultHistory
              }
            >
              CLEAR HISTORY
            </button>
          </div>

          {faultHistory.length ===
          0 ? (
            <div className="logger-empty">
              No historical faults
              recorded.
            </div>
          ) : (
            <div className="fault-history">
              {faultHistory.map(
                (fault) => (
                  <div
                    key={fault}
                    className="fault-history-item"
                  >
                    <AlertTriangle
                      size={16}
                    />

                    <span>
                      {fault}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className={workspaceClass(
            "tuning",
            "panel",
          )}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ECU CALIBRATION
              </span>

              <h2>
                Calibration Workspace
              </h2>

              <p className="profile-description">
                Professional table editing for fuel,
                ignition and boost calibration with
                compare, undo, interpolation, smoothing
                and 3D surface views.
              </p>
            </div>

            <div className="lambda-status active">
              <span className="status-dot online" />

              LIVE CALIBRATION
            </div>
          </div>

          <DefinitionFileManager
            activeFile={
              externalDefinitionFile
            }
            onLoad={
              setExternalDefinitionFile
            }
          />

          <DefinitionStudio
            activeFile={
              externalDefinitionFile
            }
            builtInDefinitions={
              builtInDefinitions
            }
            onFileChange={
              setExternalDefinitionFile
            }
          />

          <DefinitionDatabasePanel
            image={
              loadedRomImage
            }
            builtInDefinitions={
              builtInDefinitions
            }
            activeFile={
              externalDefinitionFile
            }
            onAddDefinition={
              addDiscoveredDefinition
            }
          />

          <RomImageManager
            definitions={
              calibrationDefinitions
            }
            onImageChange={
              setLoadedRomImage
            }
            onOriginalImageChange={
              setOriginalRomImage
            }
            exportAllowed={
              romExportAllowed
            }
          />

          <RomValidationPanel
            originalImage={
              originalRomImage
            }
            currentImage={
              loadedRomImage
            }
            definitions={
              calibrationDefinitions
            }
            definitionFile={
              externalDefinitionFile
            }
          />

          <RomCalibrationEnginePanel
            image={
              loadedRomImage
            }
            definitions={
              calibrationDefinitions
            }
            activeDefinitionId={
              activeDefinitionId
            }
            activeMap={
              activeMap
            }
            onMapDecoded={
              handleRomDecodedMap
            }
            onRomBytesChange={
              handleRomBytesChange
            }
          />

          <div className="tuning-workspace">
            <DefinitionBrowser
              definitions={
                calibrationDefinitions
              }
              activeDefinitionId={
                activeDefinitionId
              }
              favouriteIds={
                currentProject.favouriteMapIds
              }
              onSelect={(definitionId) => {
                setActiveDefinitionId(
                  definitionId,
                );

                const definition =
                  calibrationDefinitions.find(
                    (item) =>
                      item.id ===
                      definitionId,
                  );

                if (
                  definition?.map
                ) {
                  changeMap(
                    definition.map.id,
                  );
                }
              }}
              onToggleFavourite={
                toggleMapFavourite
              }
            />

            {activeDefinition?.map ? (
              <MapEditor
              map={activeMap}
              onChange={
                handleMapChange
              }
              livePoint={
                state.engineRunning
                  ? {
                      rpm:
                        state.sensors.rpm,

                      loadPercent:
                        state.sensors.engineLoad *
                        100,
                    }
                  : null
              }
              tracePoint={
                mapTraceSample
                  ? {
                      rpm:
                        mapTraceSample.rpm,

                      loadPercent:
                        mapTraceSample.engineLoad,
                    }
                  : null
              }
              logSamples={
                logSamples
              }
            />
            ) : activeDefinition ? (
              <DefinitionEditor
                definition={
                  activeDefinition
                }
                onValueChange={
                  updateDefinitionValue
                }
              />
            ) : null}
          </div>

        </section>

        <section className={workspaceClass(
            "tuning",
            "panel",
          )}>
          <CalibrationPanel
            maps={
              calibrationMaps
            }
            onLoadMaps={
              loadCalibrationMaps
            }
            onResetMaps={
              resetCalibrationMaps
            }
          />
        </section>

        <section className={workspaceClass(
            "tuning",
            "panel",
          )}>
          <FlashManager
            maps={
              calibrationMaps
            }
            onLoadMaps={
              loadCalibrationMaps
            }
          />
        </section>

        <section className={workspaceClass(
            "tuning",
            "panel",
          )}>
          <AutoTunePanel
            samples={
              logSamples
            }
            maps={
              calibrationMaps
            }
            onApplyFuelMap={
              applyAutoTuneFuelMap
            }
          />
        </section>

        <section
          className={workspaceClass(
            "diagnostics",
            "bottom-grid",
          )}
        >
          <div className="panel">
            <HealthRow
              label="ECU Core"
              status="OK"
            />

            <HealthRow
              label="Fuel Control"
              status={
                lambdaActive
                  ? "CLOSED LOOP"
                  : "OPEN LOOP"
              }
            />

            <HealthRow
              label="Rev Limiter"
              status={
                limiterActive
                  ? "ACTIVE"
                  : "READY"
              }
            />

            <HealthRow
              label="Launch Control"
              status={
                state.limiter
                  .launchControlActive
                  ? "ACTIVE"
                  : "READY"
              }
            />

            <HealthRow
              label="Boost Protection"
              status={
                state.boostProtection
                  .cutActive
                  ? "CUT"
                  : state.boostProtection
                      .warningActive
                    ? "WARNING"
                    : "READY"
              }
            />

            <HealthRow
              label="Knock Control"
              status={
                state.knockControl
                  .severeKnock
                  ? "SEVERE"
                  : state.knockControl
                      .knockDetected
                    ? "ACTIVE"
                    : "OK"
              }
            />

            <HealthRow
              label="Engine Protection"
              status={state.engineProtection.level.toUpperCase()}
            />

            <HealthRow
              label="Traction Control"
              status={
                tractionControl.severe
                  ? "SEVERE"
                  : tractionControl.active
                    ? "ACTIVE"
                    : "READY"
              }
            />

            <HealthRow
              label="Flex Fuel"
              status={
                state.flexFuel.active
                  ? `E${Math.round(
                      state.flexFuel.ethanolPercent,
                    )}`
                  : "PETROL"
              }
            />

            <HealthRow
              label="Anti-Lag"
              status={
                state.antiLag.thermalProtection
                  ? "THERMAL"
                  : state.antiLag.active
                    ? "ACTIVE"
                    : state.antiLag.enabled
                      ? "ARMED"
                      : "OFF"
              }
            />

            <HealthRow
              label="No-Lift Shift"
              status={
                state.noLiftShift.active
                  ? "SHIFT CUT"
                  : state.noLiftShift.recovering
                    ? "RECOVERY"
                    : state.noLiftShift.armed
                      ? "ARMED"
                      : state.noLiftShift.enabled
                        ? "READY"
                        : "OFF"
              }
            />

            <HealthRow
              label="Pit Limiter"
              status={
                state.pitLimiter.hardCutActive
                  ? "HARD CUT"
                  : state.pitLimiter.active
                    ? "LIMITING"
                    : state.pitLimiter.enabled
                      ? "ARMED"
                      : "OFF"
              }
            />

            <HealthRow
              label="Boost-by-Gear"
              status={
                state.boostByGear.active
                  ? "LIMITING"
                  : state.boostByGear.enabled
                    ? "ACTIVE"
                    : "OFF"
              }
            />

            <HealthRow
              label="Transmission"
              status={
                state.transmission.shiftOccurred
                  ? "SHIFTING"
                  : state.transmission.enabled
                    ? "AUTO"
                    : "MANUAL"
              }
            />

            <HealthRow
              label="Torque Management"
              status={
                state.torqueManagement.active
                  ? "ACTIVE"
                  : "READY"
              }
            />

            <HealthRow
              label="Drive Mode Torque"
              status={activeMode.name.toUpperCase()}
            />

            <HealthRow
              label="Rolling Launch"
              status={
                state.rollingLaunch.active
                  ? "BOOST BUILD"
                  : state.rollingLaunch.armed
                    ? "ARMED"
                    : state.rollingLaunch.enabled
                      ? "READY"
                      : "OFF"
              }
            />

            <HealthRow
              label="Brake Boost"
              status={
                state.brakeBoost.thermalProtection
                  ? "THERMAL"
                  : state.brakeBoost.active
                    ? "BOOST BUILD"
                    : state.brakeBoost.armed
                      ? "ARMED"
                      : state.brakeBoost.enabled
                        ? "READY"
                        : "OFF"
              }
            />

            <HealthRow
              label="Virtual Dyno"
              status={
                state.virtualDyno.active
                  ? "LIVE"
                  : "READY"
              }
            />

            <HealthRow
              label="Sensor Diagnostics"
              status={
                state.sensorFaults.limpModeRequested
                  ? "LIMP MODE"
                  : state.sensorFaults.active
                    ? "FAULT"
                    : "OK"
              }
            />

            <HealthRow
              label="DTC Manager"
              status={
                state.diagnostics.milActive
                  ? "MIL ON"
                  : state.diagnostics.stored.length >
                      0
                    ? "STORED"
                    : "OK"
              }
            />

            <HealthRow
              label="Protection Settings"
              status="CONFIGURED"
            />

            <HealthRow
              label="CAN Bus"
              status={
                state.canBus.enabled
                  ? state.canBus.status.toUpperCase()
                  : "OFF"
              }
            />

            <HealthRow
              label="Sensor Calibration"
              status="CONFIGURED"
            />

            <HealthRow
              label="Test Bench"
              status={
                state.testBench.running
                  ? "RUNNING"
                  : state.testBench.status
              }
            />

            <HealthRow
              label="Data Logger"
              status={
                logging
                  ? "RECORDING"
                  : "OK"
              }
            />
          </div>

          <div className="panel warning-panel">
            <AlertTriangle
              size={22}
            />

            <div>
              <h2>
                {state.faults.length ===
                0
                  ? "No Faults Detected"
                  : `${state.faults.length} Fault${
                      state.faults.length ===
                      1
                        ? ""
                        : "s"
                    } Detected`}
              </h2>

              {state.faults.map(
                (fault) => (
                  <p key={fault}>
                    ⚠ {fault}
                  </p>
                ),
              )}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>
          {APP_NAME} v{APP_VERSION}
          {" · "}
          {RELEASE_CHANNEL}
        </span>

        <span>
          <Settings size={15} />
          SIMULATION MODE
        </span>
      </footer>
    </div>
  );
}

function GaugeCard({
  icon,
  label,
  value,
  unit,
  percent,
  maxLabel,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  percent: number;
  maxLabel: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`gauge-card ${
        danger
          ? "danger"
          : ""
      }`}
    >
      <div className="gauge-top">
        <div className="gauge-icon">
          {icon}
        </div>

        <span className="gauge-label">
          {label}
        </span>
      </div>

      <div className="gauge-value">
        {value}

        <small>
          {unit}
        </small>
      </div>

      <div className="gauge-track">
        <div
          className="gauge-fill"
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                percent,
              ),
            )}%`,
          }}
        />
      </div>

      <div className="gauge-range">
        <span>0</span>

        <span>
          MAX {maxLabel}
        </span>
      </div>
    </div>
  );
}

function TelemetryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="telemetry-item">
      <span>{label}:{"\u00A0"}</span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function LambdaValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="lambda-value">
      <span>{label}:{"\u00A0"}</span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ConditionRow({
  label,
  passed,
  value,
}: {
  label: string;
  passed: boolean;
  value: string;
}) {
  return (
    <div className="lambda-condition">
      <div>
        <span
          className={`status-dot ${
            passed
              ? "online"
              : ""
          }`}
        />

        <strong>
          {label}
        </strong>
      </div>

      <span>
        {value}
      </span>
    </div>
  );
}

function ProtectionInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (
    value: number,
  ) => void;
}) {
  return (
    <div className="control">
      <span>
        {label}:{"\u00A0"}
      </span>

      <strong>
        {value.toFixed(
          step < 1 ? 2 : 0,
        )}{" "}
        {unit}
      </strong>

      <input
        className="throttle"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value,
            ),
          )
        }
      />
    </div>
  );
}

function DtcCard({
  record,
}: {
  record: DtcRecord;
}) {
  const status =
    record.current
      ? "CURRENT"
      : record.pending
        ? "PENDING"
        : "STORED";

  return (
    <div className="control">
      <div className="panel-header">
        <div>
          <span className="eyebrow">
            {record.code}
          </span>

          <h2>
            {record.message}
          </h2>
        </div>

        <strong>
          {status}
          {" · "}
          {record.severity.toUpperCase()}
        </strong>
      </div>

      <div className="lambda-grid">
        <LambdaValue
          label="OCCURRENCES"
          value={`${record.occurrences}`}
        />

        <LambdaValue
          label="RPM"
          value={`${Math.round(
            record.freezeFrame.rpm,
          )}`}
        />

        <LambdaValue
          label="THROTTLE"
          value={`${record.freezeFrame.throttlePercent.toFixed(
            1,
          )}%`}
        />

        <LambdaValue
          label="LOAD"
          value={`${record.freezeFrame.engineLoadPercent.toFixed(
            1,
          )}%`}
        />

        <LambdaValue
          label="MAP"
          value={`${record.freezeFrame.manifoldPressureKpa.toFixed(
            1,
          )} KPA`}
        />

        <LambdaValue
          label="COOLANT"
          value={`${record.freezeFrame.coolantTemperatureC.toFixed(
            1,
          )}°C`}
        />

        <LambdaValue
          label="AFR"
          value={record.freezeFrame.airFuelRatio.toFixed(
            2,
          )}
        />

        <LambdaValue
          label="OIL"
          value={`${record.freezeFrame.oilPressureKpa.toFixed(
            0,
          )} KPA`}
        />

        <LambdaValue
          label="BATTERY"
          value={`${record.freezeFrame.batteryVoltage.toFixed(
            2,
          )} V`}
        />

        <LambdaValue
          label="SPEED"
          value={`${record.freezeFrame.vehicleSpeedKph.toFixed(
            0,
          )} KM/H`}
        />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="stat">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{label}:{"\u00A0"}</span>

        <strong>
          {value}{" "}

          <small>
            {unit}
          </small>
        </strong>
      </div>
    </div>
  );
}

function Control({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="control">
      <span>{label}:{"\u00A0"}</span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ProfileSpec({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="control">
      <span>{label}:{"\u00A0"}</span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function HealthRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="health-row">
      <span>{label}:{"\u00A0"}</span>

      <strong>
        <span className="status-dot online" />

        {status}
      </strong>
    </div>
  );
}

function formatSigned(
  value: number,
  decimals: number,
  unit: string,
): string {
  const prefix =
    value > 0
      ? "+"
      : "";

  return `${prefix}${value.toFixed(
    decimals,
  )}${unit}`;
}

function formatAspiration(
  aspiration: string,
): string {
  return aspiration
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatFuel(
  fuel: string,
): string {
  return fuel
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

export default App;