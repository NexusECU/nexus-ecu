import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Cable,
  Cpu,
  Power,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Usb,
} from "lucide-react";

import {
  isTauri,
} from "@tauri-apps/api/core";

import {
  closeSlcanMonitor,
  configureSlcanMonitor,
  connectSerialDevice,
  disconnectSerialDevice,
  getHardwareConnection,
  listSerialDevices,
  readSerialBytes,
} from "./hardwareService";

import {
  extractSlcanFrames,
  type CanFrame,
} from "./canParser";

import {
  CanMonitor,
} from "./CanMonitor";

import {
  CanSignalPanel,
} from "./CanSignalPanel";

import {
  TransportCompatibilityPanel,
} from "./TransportCompatibilityPanel";

import {
  ProviderRuntimePanel,
} from "./ProviderRuntimePanel";

import {
  J2534ProviderPanel,
} from "./J2534ProviderPanel";

import {
  ElmProviderPanel,
} from "./ElmProviderPanel";

import {
  ReadOnlyHardwareSession,
} from "./ReadOnlyHardwareSession";

import {
  EcuReadBackupPanel,
} from "./EcuReadBackupPanel";

import {
  EcuIdentificationPanel,
} from "./EcuIdentificationPanel";

import {
  HardwareDiagnosticsPanel,
} from "./HardwareDiagnosticsPanel";

import {
  LiveDiagnosticDashboard,
} from "./LiveDiagnosticDashboard";

import {
  AdapterProfilesPanel,
} from "./AdapterProfilesPanel";

import {
  AdapterConnectionWizard,
} from "./AdapterConnectionWizard";

import {
  VehicleEcuDetectionWorkspace,
} from "./VehicleEcuDetectionWorkspace";

import {
  EcuSessionManager,
} from "./EcuSessionManager";

import {
  EcuCapabilityMatrixPanel,
} from "./EcuCapabilityMatrixPanel";

import {
  UnifiedEcuWorkspace,
} from "./UnifiedEcuWorkspace";

import {
  SessionPersistencePanel,
} from "../desktop/SessionPersistencePanel";

import {
  ProjectRestoreCard,
} from "../desktop/ProjectRestoreCard";

import {
  VehicleProjectProfilesPanel,
} from "../desktop/VehicleProjectProfilesPanel";

import type {
  VehicleProjectProfile,
} from "../desktop/vehicleProjectTypes";

import {
  ProjectHistoryPanel,
} from "../desktop/ProjectHistoryPanel";

import {
  ProjectFileStoragePanel,
} from "../desktop/ProjectFileStoragePanel";

import {
  clearProjectSessionState,
  loadProjectSessionState,
  saveProjectSessionState,
} from "../desktop/sessionPersistenceService";

import type {
  NexusProjectSessionState,
  PersistedWorkspaceTab,
} from "../desktop/sessionPersistenceTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import type {
  HardwareConnectionInfo,
  OperatingMode,
  SerialDeviceInfo,
} from "./hardwareTypes";

import "./hardware-manager.css";
import "./read-only-hardware-session.css";
import "./ecu-read-backup.css";
import "./ecu-identification.css";
import "./hardware-diagnostics.css";
import "./live-diagnostic-dashboard.css";
import "./adapter-profiles.css";
import "./adapter-connection-wizard.css";
import "./vehicle-ecu-detection.css";
import "./ecu-session-manager.css";
import "./ecu-capability-matrix.css";
import "./unified-ecu-workspace.css";
import "../desktop/session-persistence.css";
import "../desktop/project-restore-card.css";
import "../desktop/vehicle-project-profiles.css";
import "../desktop/project-history.css";
import "../desktop/project-file-storage.css";

type HardwareManagerProps = {
  loadedRomImage?: import("../rom/romTypes").RomImageInfo | null;

  operatingMode:
    OperatingMode;

  onOperatingModeChange: (
    mode:
      OperatingMode,
  ) => void;
};

const emptyConnection:
  HardwareConnectionInfo = {
    connected: false,

    portName: null,

    baudRate: null,

    bytesReceived: 0,
  };

const baudRates = [
  9600,
  19200,
  38400,
  57600,
  115200,
  230400,
  460800,
  921600,
];

function hexByte(
  value: number,
): string {
  return value
    .toString(16)
    .toUpperCase()
    .padStart(
      2,
      "0",
    );
}

function asciiByte(
  value: number,
): string {
  if (
    value >= 32 &&
    value <= 126
  ) {
    return String.fromCharCode(
      value,
    );
  }

  if (
    value === 10
  ) {
    return "↵";
  }

  if (
    value === 13
  ) {
    return "⏎";
  }

  return "·";
}

function describeDevice(
  device:
    SerialDeviceInfo,
): string {
  const identity = [
    device.product,
    device.manufacturer,
  ]
    .filter(Boolean)
    .join(
      " · ",
    );

  if (
    device.vid !==
      null &&
    device.pid !==
      null
  ) {
    return `${identity ||
      device.portType} · VID ${device.vid
      .toString(16)
      .toUpperCase()
      .padStart(
        4,
        "0",
      )} / PID ${device.pid
      .toString(16)
      .toUpperCase()
      .padStart(
        4,
        "0",
      )}`;
  }

  return identity ||
    device.portType;
}

export function HardwareManager({
  loadedRomImage,
  operatingMode,
  onOperatingModeChange,
}: HardwareManagerProps) {
  const desktop =
    isTauri();

  const [
    devices,
    setDevices,
  ] = useState<
    SerialDeviceInfo[]
  >([]);

  const [
    selectedPort,
    setSelectedPort,
  ] = useState("");

  const [
    baudRate,
    setBaudRate,
  ] = useState(
    115200,
  );

  const [
    connection,
    setConnection,
  ] = useState<
    HardwareConnectionInfo
  >(
    emptyConnection,
  );

  const [
    receiveBuffer,
    setReceiveBuffer,
  ] = useState<number[]>(
    [],
  );

  const [
    canFrames,
    setCanFrames,
  ] = useState<CanFrame[]>(
    [],
  );

  const [
    canActive,
    setCanActive,
  ] = useState(false);

  const [
    canBitrateKbps,
    setCanBitrateKbps,
  ] = useState(
    500,
  );

  const [
    activeTransportProvider,
    setActiveTransportProvider,
  ] = useState<TransportProviderId>(
    "slcan",
  );

  const serialProviderActive =
    activeTransportProvider ===
      "slcan" ||
    activeTransportProvider ===
      "raw-serial";

  const dedicatedProviderActive =
    activeTransportProvider ===
      "elm-obd" ||
    activeTransportProvider ===
      "j2534";

  const slcanTextRef =
    useRef(
      "",
    );

  const [
    lastReceiveAt,
    setLastReceiveAt,
  ] = useState<
    number | null
  >(
    null,
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(
    null,
  );

  const [
    busy,
    setBusy,
  ] = useState(false);

  const refreshDevices =
    async () => {
      if (!desktop) {
        return;
      }

      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        const next =
          await listSerialDevices();

        setDevices(
          next,
        );

        if (
          !selectedPort &&
          next.length >
            0
        ) {
          setSelectedPort(
            next[0]
              .portName,
          );
        }

        setConnection(
          await getHardwareConnection(),
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  useEffect(() => {
    if (
      operatingMode ===
        "live" &&
      serialProviderActive
    ) {
      void refreshDevices();
    }
  }, [
    operatingMode,
  ]);

  useEffect(() => {
    if (
      serialProviderActive
    ) {
      return;
    }

    setCanActive(
      false,
    );

    setCanFrames(
      [],
    );

    setReceiveBuffer(
      [],
    );

    slcanTextRef.current =
      "";

    if (
      connection.connected
    ) {
      void disconnectSerialDevice()
        .then(
          setConnection,
        )
        .catch(
          (caught) =>
            setError(
              caught instanceof Error
                ? caught.message
                : String(
                    caught,
                  ),
            ),
        );
    }
  }, [
    activeTransportProvider,
  ]);

  useEffect(() => {
    if (
      !desktop ||
      operatingMode !==
        "live" ||
      !serialProviderActive ||
      !connection.connected
    ) {
      return;
    }

    const interval =
      window.setInterval(
        async () => {
          try {
            const bytes =
              await readSerialBytes(
                2048,
              );

            if (
              bytes.length ===
              0
            ) {
              return;
            }

            setReceiveBuffer(
              (previous) => [
                ...previous,
                ...bytes,
              ].slice(
                -8192,
              ),
            );

            const serialText =
              slcanTextRef.current +
              String.fromCharCode(
                ...bytes,
              );

            const parsed =
              extractSlcanFrames(
                serialText,
                Date.now(),
              );

            slcanTextRef.current =
              parsed.remainder;

            if (
              parsed.frames.length >
              0
            ) {
              setCanFrames(
                (previous) => [
                  ...previous,
                  ...parsed.frames,
                ].slice(
                  -20000,
                ),
              );
            }

            setLastReceiveAt(
              Date.now(),
            );

            setConnection(
              await getHardwareConnection(),
            );
          } catch (
            caught
          ) {
            setError(
              caught instanceof Error
                ? caught.message
                : String(
                    caught,
                  ),
            );
          }
        },
        100,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    desktop,
    operatingMode,
    connection.connected,
    serialProviderActive,
  ]);

  const connect =
    async () => {
      if (
        !selectedPort
      ) {
        return;
      }

      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        setReceiveBuffer(
          [],
        );

        setLastReceiveAt(
          null,
        );

        setConnection(
          await connectSerialDevice(
            selectedPort,
            baudRate,
          ),
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  const openCanMonitor =
    async () => {
      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        slcanTextRef.current =
          "";

        setCanFrames(
          [],
        );

        await configureSlcanMonitor(
          canBitrateKbps,
        );

        setCanActive(
          true,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  const closeCan =
    async () => {
      try {
        setBusy(
          true,
        );

        await closeSlcanMonitor();

        setCanActive(
          false,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  const disconnect =
    async () => {
      try {
        setBusy(
          true,
        );

        if (
          canActive
        ) {
          await closeSlcanMonitor();
        }

        setCanActive(
          false,
        );

        setConnection(
          await disconnectSerialDevice(),
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  const hexPreview =
    useMemo(
      () =>
        receiveBuffer
          .slice(-512)
          .map(
            hexByte,
          )
          .join(
            " ",
          ),
      [
        receiveBuffer,
      ],
    );

  const asciiPreview =
    useMemo(
      () =>
        receiveBuffer
          .slice(-512)
          .map(
            asciiByte,
          )
          .join(
            "",
          ),
      [
        receiveBuffer,
      ],
    );

  const selectedDevice =
    devices.find(
      (device) =>
        device.portName ===
        selectedPort,
    );

  const linkHealth =
    !connection.connected
      ? "DISCONNECTED"
      : lastReceiveAt ===
          null
        ? "CONNECTED · WAITING FOR DATA"
        : Date.now() -
              lastReceiveAt <
            1500
          ? "DATA ACTIVE"
          : "CONNECTED · IDLE";

  const [
    persistedSession,
    setPersistedSession,
  ] = useState<
    NexusProjectSessionState | null
  >(
    () =>
      loadProjectSessionState(),
  );

  const [
    workspaceTab,
    setWorkspaceTab,
  ] = useState<
    PersistedWorkspaceTab
  >(
    persistedSession?.hardware.workspaceTab ??
    "overview",
  );


  const [
    restorePromptDismissed,
    setRestorePromptDismissed,
  ] = useState(
    false,
  );

  const [
    activeVehicleProject,
    setActiveVehicleProject,
  ] = useState<
    VehicleProjectProfile | null
  >(
    null,
  );

  const currentPersistedState:
    NexusProjectSessionState = {
      schemaVersion:
        1,

      updatedAt:
        new Date()
          .toISOString(),

      hardware: {
        providerId:
          activeTransportProvider,

        selectedPort:
          selectedPort,

        serialBaud:
          baudRate,

        canBitrateKbps:
          canBitrateKbps,

        workspaceTab,

        selectedEcuAddress:
          "AUTO",

        identity: {
          vin:
            null,

          calibrationIds:
            [],

          cvns:
            [],

          ecuNames:
            [],
        },
      },

      rom:
        loadedRomImage
          ? {
              fileName:
                loadedRomImage.fileName,

              sizeBytes:
                loadedRomImage.bytes.length,

              sha256:
                loadedRomImage.sha256,
            }
          : null,

      definition:
        null,
    };

  const saveCurrentSession =
    () => {
      saveProjectSessionState(
        currentPersistedState,
      );

      setPersistedSession(
        currentPersistedState,
      );
    };

  const restoreSavedSession =
    () => {
      if (
        !persistedSession
      ) {
        return;
      }

      setActiveTransportProvider(
        persistedSession.hardware.providerId,
      );

      setSelectedPort(
        persistedSession.hardware.selectedPort,
      );

      setBaudRate(
        persistedSession.hardware.serialBaud,
      );

      setCanBitrateKbps(
        persistedSession.hardware.canBitrateKbps,
      );

      setWorkspaceTab(
        persistedSession.hardware.workspaceTab,
      );

      setRestorePromptDismissed(
        true,
      );
    };

  const clearSavedSession =
    () => {
      clearProjectSessionState();

      setPersistedSession(
        null,
      );

      setRestorePromptDismissed(
        true,
      );
    };

  const openVehicleProject =
    (
      project:
        VehicleProjectProfile,
    ) => {
      const saved =
        project.session;

      setPersistedSession(
        saved,
      );

      setActiveTransportProvider(
        saved.hardware.providerId,
      );

      setSelectedPort(
        saved.hardware.selectedPort,
      );

      setBaudRate(
        saved.hardware.serialBaud,
      );

      setCanBitrateKbps(
        saved.hardware.canBitrateKbps,
      );

      setWorkspaceTab(
        saved.hardware.workspaceTab,
      );

      setRestorePromptDismissed(
        true,
      );

      setActiveVehicleProject(
        project,
      );
    };

  return (
    <section className="hardware-manager">
      <div className="hardware-mode-bar">
        <div>
          <span className="eyebrow">
            OPERATING ENVIRONMENT
          </span>

          <strong>
            {operatingMode ===
            "simulator"
              ? "SIMULATOR"
              : "LIVE ECU"}
          </strong>
        </div>

        <div className="hardware-mode-buttons">
          <button
            type="button"
            className={
              operatingMode ===
              "simulator"
                ? "active"
                : ""
            }
            onClick={() =>
              onOperatingModeChange(
                "simulator",
              )
            }
          >
            <Cpu
              size={14}
            />

            SIMULATOR
          </button>

          <button
            type="button"
            className={
              operatingMode ===
              "live"
                ? "active"
                : ""
            }
            onClick={() =>
              onOperatingModeChange(
                "live",
              )
            }
          >
            <Cable
              size={14}
            />

            LIVE ECU
          </button>
        </div>

        <div className="hardware-readonly">
          <ShieldCheck
            size={14}
          />

          READ ONLY
        </div>
      </div>

      {operatingMode ===
      "live" && (
        <div className="hardware-live-panel">
          <div className="hardware-live-header">
            <div>
              <span className="eyebrow">
                HARDWARE COMMUNICATION / V8.7
              </span>

              <h2>
                Read-Only Hardware Integration
              </h2>

              <p className="profile-description">
                Connect supported read-only providers, observe
                real vehicle-network traffic and build protocol /
                ECU evidence without enabling ECU programming or
                arbitrary transmit controls.
              </p>
            </div>

            <div
              className={`hardware-link-state ${
                connection.connected
                  ? "online"
                  : ""
              }`}
            >
              <span
                className={`status-dot ${
                  connection.connected
                    ? "online"
                    : ""
                }`}
              />

              {linkHealth}
            </div>
          </div>

          <TransportCompatibilityPanel
            activeProvider={
              activeTransportProvider
            }
            onActiveProviderChange={
              setActiveTransportProvider
            }
          />

                    <VehicleProjectProfilesPanel
            currentSession={
              currentPersistedState
            }
            onOpenProject={
              openVehicleProject
            }
            onActiveProjectChange={
              setActiveVehicleProject
            }
          />

          <ProjectHistoryPanel
            activeProject={
              activeVehicleProject
            }
            currentSession={
              currentPersistedState
            }
            onRestoreSession={(
              restored,
            ) => {
              setPersistedSession(
                restored,
              );

              setActiveTransportProvider(
                restored.hardware.providerId,
              );

              setSelectedPort(
                restored.hardware.selectedPort,
              );

              setBaudRate(
                restored.hardware.serialBaud,
              );

              setCanBitrateKbps(
                restored.hardware.canBitrateKbps,
              );

              setWorkspaceTab(
                restored.hardware.workspaceTab,
              );
            }}
          />

          <ProjectFileStoragePanel
            activeProject={
              activeVehicleProject
            }
            currentSession={
              currentPersistedState
            }
          />

          {persistedSession &&
          !restorePromptDismissed && (
            <ProjectRestoreCard
              savedState={
                persistedSession
              }
              onRestore={
                restoreSavedSession
              }
              onDismiss={() =>
                setRestorePromptDismissed(
                  true,
                )
              }
              onClear={
                clearSavedSession
              }
            />
          )}

          <SessionPersistencePanel
            currentState={
              currentPersistedState
            }
            restoredState={
              persistedSession
            }
            onSave={
              saveCurrentSession
            }
            onRestore={
              restoreSavedSession
            }
            onClear={
              clearSavedSession
            }
          />

          <UnifiedEcuWorkspace
            providerId={
              activeTransportProvider
            }
            initialTab={
              workspaceTab
            }
            onTabChange={
              setWorkspaceTab
            }
            connection={
              connection
            }
            frames={
              canFrames
            }
            adapterDetected={
              connection.connected
            }
            canMonitorActive={
              canActive
            }
            bitrateKbps={
              canActive
                ? canBitrateKbps
                : null
            }
            lastActivityMs={
              lastReceiveAt
            }
            lastError={
              error
            }
            loadedRomImage={
              loadedRomImage ??
              null
            }
          />

                    <div className="legacy-hardware-panels-v8">
          <div className="v74-dashboard-visible-banner">
            LIVE DIAGNOSTIC DASHBOARD · V7.4
          </div>

          <LiveDiagnosticDashboard
            connection={
              connection
            }
            frames={
              canFrames
            }
            adapterDetected={
              connection.connected
            }
            canMonitorActive={
              canActive
            }
            bitrateKbps={
              canActive
                ? canBitrateKbps
                : null
            }
            vin={
              null
            }
            calibrationIds={
              []
            }
            lastError={
              error
            }
            lastActivityMs={
              lastReceiveAt
            }
          />

          <AdapterProfilesPanel
            activeProvider={
              activeTransportProvider
            }
            onSelectProvider={
              setActiveTransportProvider
            }
          />

          <AdapterConnectionWizard
            activeProvider={
              activeTransportProvider
            }
            onSelectProvider={
              setActiveTransportProvider
            }
            availablePorts={
              devices.map(
                (device) =>
                  device.portName,
              )
            }
            selectedPort={
              selectedPort
            }
            onSelectPort={
              setSelectedPort
            }
            selectedBaud={
              baudRate
            }
            onSelectBaud={
              setBaudRate
            }
            selectedCanBitrateKbps={
              canBitrateKbps
            }
            onSelectCanBitrateKbps={
              setCanBitrateKbps
            }
            connection={
              connection
            }
            error={
              error
            }
            framesObserved={
              canFrames.length
            }
          />

          <VehicleEcuDetectionWorkspace
            frames={
              canFrames
            }
            vin={
              null
            }
            calibrationIds={
              []
            }
            cvns={
              []
            }
            ecuNames={
              []
            }
            bitrateKbps={
              canActive
                ? canBitrateKbps
                : null
            }
          />

          <EcuSessionManager
            frames={
              canFrames
            }
            adapterReady={
              connection.connected
            }
            linkReady={
              connection.connected
            }
            bitrateKbps={
              canActive
                ? canBitrateKbps
                : null
            }
            vin={
              null
            }
            calibrationIds={
              []
            }
          />

          <EcuCapabilityMatrixPanel
            providerId={
              activeTransportProvider
            }
            adapterReady={
              connection.connected
            }
            linkReady={
              connection.connected
            }
            diagnosticResponderReady={
              canFrames.some(
                (frame) =>
                  frame.id >=
                    0x7e8 &&
                  frame.id <=
                    0x7ef,
              )
            }
            identityReady={
              false
            }
            romImageLoaded={
              Boolean(
                loadedRomImage,
              )
            }
          />

          <ProviderRuntimePanel
            providerId={
              activeTransportProvider
            }
          />

          <J2534ProviderPanel
            active={
              activeTransportProvider ===
              "j2534"
            }
          />

          <ElmProviderPanel
            active={
              activeTransportProvider ===
              "elm-obd"
            }
          />

          <ReadOnlyHardwareSession
            providerId={
              activeTransportProvider
            }
            connection={
              connection
            }
            adapterDetected={
              connection.connected
            }
            frames={
              canFrames
            }
            canMonitorActive={
              canActive
            }
            bitrateKbps={
              canActive
                ? canBitrateKbps
                : null
            }
            lastActivityMs={
              lastReceiveAt
            }
          />

          <EcuReadBackupPanel
            providerId={
              activeTransportProvider
            }
            adapterDetected={
              connection.connected
            }
            linkConnected={
              connection.connected
            }
            identitySummary={
              connection.connected
                ? "READ-ONLY SESSION READY / ECU IDENTITY NOT ACTIVELY REQUESTED"
                : "UNKNOWN"
            }
            protocolSummary={
              canFrames.length
                ? `${canFrames.length} CAN FRAME(S) OBSERVED`
                : "UNKNOWN"
            }
            loadedRomImage={
              loadedRomImage ??
              null
            }
          />

          <EcuIdentificationPanel
            adapterDetected={
              connection.connected
            }
            linkConnected={
              connection.connected
            }
          />

          <HardwareDiagnosticsPanel
            connection={
              connection
            }
            frames={
              canFrames
            }
            adapterDetected={
              connection.connected
            }
            canMonitorActive={
              canActive
            }
            bitrateKbps={
              canActive
                ? canBitrateKbps
                : null
            }
            vin={
              null
            }
            calibrationIds={
              []
            }
            lastError={
              error
            }
          />

          

          </div>

          {!desktop ? (
            <div className="hardware-desktop-required">
              <Usb
                size={20}
              />

              Live hardware requires the Tauri desktop
              application. Browser preview remains
              simulator-only.
            </div>
          ) : !serialProviderActive &&
            !dedicatedProviderActive ? (
            <div className="hardware-provider-placeholder">
              <Cable
                size={20}
              />

              <div>
                <strong>
                  {activeTransportProvider.toUpperCase()} PROVIDER SELECTED
                </strong>

                <span>
                  This provider now routes through the universal
                  NEXUS transport layer. Its native bridge must be
                  installed before live connection controls are enabled.
                </span>
              </div>
            </div>
          ) : dedicatedProviderActive ? (
            <></>
          ) : (
            <>
              <div className="hardware-connect-grid">
                <label>
                  <span>
                    INTERFACE / COM PORT
                  </span>

                  <select
                    value={
                      selectedPort
                    }
                    disabled={
                      connection.connected ||
                      busy
                    }
                    onChange={(event) =>
                      setSelectedPort(
                        event.target
                          .value,
                      )
                    }
                  >
                    {devices.length ===
                    0 ? (
                      <option value="">
                        No serial interfaces detected
                      </option>
                    ) : (
                      devices.map(
                        (
                          device,
                        ) => (
                          <option
                            key={
                              device.portName
                            }
                            value={
                              device.portName
                            }
                          >
                            {device.portName}
                            {" — "}
                            {describeDevice(
                              device,
                            )}
                          </option>
                        ),
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    SERIAL BAUD
                  </span>

                  <select
                    value={
                      baudRate
                    }
                    disabled={
                      connection.connected ||
                      busy
                    }
                    onChange={(event) =>
                      setBaudRate(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                  >
                    {baudRates.map(
                      (rate) => (
                        <option
                          key={
                            rate
                          }
                          value={
                            rate
                          }
                        >
                          {rate.toLocaleString()}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={
                    busy ||
                    connection.connected
                  }
                  onClick={
                    refreshDevices
                  }
                >
                  <RefreshCw
                    size={14}
                  />

                  SCAN
                </button>

                {connection.connected ? (
                  <button
                    type="button"
                    className="danger"
                    disabled={
                      busy
                    }
                    onClick={
                      disconnect
                    }
                  >
                    <Power
                      size={14}
                    />

                    DISCONNECT
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary"
                    disabled={
                      busy ||
                      !selectedPort
                    }
                    onClick={
                      connect
                    }
                  >
                    <Usb
                      size={14}
                    />

                    CONNECT READ-ONLY
                  </button>
                )}
              </div>

              <div className="hardware-can-config">
                <label>
                  <span>
                    CAN BITRATE
                  </span>

                  <select
                    value={
                      canBitrateKbps
                    }
                    disabled={
                      !connection.connected ||
                      canActive ||
                      busy
                    }
                    onChange={(event) =>
                      setCanBitrateKbps(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                  >
                    {[10,20,50,100,125,250,500,800,1000].map(
                      (rate) => (
                        <option
                          key={
                            rate
                          }
                          value={
                            rate
                          }
                        >
                          {rate} KBIT/S
                        </option>
                      ),
                    )}
                  </select>
                </label>

                {canActive ? (
                  <button
                    type="button"
                    className="danger"
                    disabled={
                      busy
                    }
                    onClick={
                      closeCan
                    }
                  >
                    CLOSE CAN
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary"
                    disabled={
                      busy ||
                      !connection.connected
                    }
                    onClick={
                      openCanMonitor
                    }
                  >
                    OPEN CAN MONITOR
                  </button>
                )}

                <div className="hardware-can-warning">
                  RX SOFTWARE ONLY · ADAPTER MAY STILL ACK CAN TRAFFIC
                </div>
              </div>

              <div className="hardware-stats">
                <HardwareStat
                  label="PORT"
                  value={
                    connection
                      .portName ??
                    "—"
                  }
                />

                <HardwareStat
                  label="BAUD"
                  value={
                    connection
                      .baudRate?.toLocaleString() ??
                    "—"
                  }
                />

                <HardwareStat
                  label="BYTES RX"
                  value={
                    connection
                      .bytesReceived
                      .toLocaleString()
                  }
                />

                <HardwareStat
                  label="BUFFER"
                  value={`${receiveBuffer.length.toLocaleString()} B`}
                />

                <HardwareStat
                  label="TRANSMIT"
                  value="DISABLED"
                />

                <HardwareStat
                  label="PROTOCOL"
                  value="RAW SERIAL"
                />
              </div>

              {selectedDevice && (
                <div className="hardware-device-info">
                  <Usb
                    size={15}
                  />

                  <div>
                    <strong>
                      {selectedDevice.product ??
                        selectedDevice.portName}
                    </strong>

                    <span>
                      {describeDevice(
                        selectedDevice,
                      )}

                      {selectedDevice.serialNumber
                        ? ` · S/N ${selectedDevice.serialNumber}`
                        : ""}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="hardware-error">
                  {error}
                </div>
              )}

              <div className="hardware-terminal-grid">
                <div className="hardware-terminal">
                  <div className="hardware-terminal-header">
                    <Terminal
                      size={14}
                    />

                    RAW HEX RX
                  </div>

                  <pre>
                    {hexPreview ||
                      "Waiting for incoming serial bytes…"}
                  </pre>
                </div>

                <div className="hardware-terminal">
                  <div className="hardware-terminal-header">
                    <Terminal
                      size={14}
                    />

                    ASCII RX
                  </div>

                  <pre>
                    {asciiPreview ||
                      "Waiting for incoming serial bytes…"}
                  </pre>
                </div>
              </div>

              <CanMonitor
                frames={
                  canFrames
                }
                active={
                  canActive
                }
                bitrateKbps={
                  canActive
                    ? canBitrateKbps
                    : null
                }
                onClear={() =>
                  setCanFrames(
                    [],
                  )
                }
              />

              <CanSignalPanel
                frames={
                  canFrames
                }
                canActive={
                  canActive
                }
              />

              <div className="hardware-safety-note">
                <ShieldCheck
                  size={15}
                />

                <span>
                  V7.0 adds a unified read-only hardware session,
                  passive diagnostic evidence and real CAN receive
                  analysis. NEXUS exposes no arbitrary CAN transmit
                  or ECU programming control in this release.
                  Opening a normal CAN channel can still make the
                  adapter participate electrically in the bus
                  (for example by ACKing valid traffic).
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function HardwareStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
