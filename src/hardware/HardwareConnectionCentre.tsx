import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Cpu,
  PlugZap,
  Radio,
  RefreshCw,
  ShieldCheck,
  Usb,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ADAPTER_PROFILES,
} from "./adapterProfiles";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import {
  loadExperienceSettings,
} from "../desktop/experienceSettings";

import "./hardware-connection-centre.css";

type Props = {
  activeProvider: TransportProviderId;
  onSelectProvider: (provider: TransportProviderId) => void;
  availablePorts: string[];
  selectedPort: string;
  onSelectPort: (port: string) => void;
  selectedBaud: number;
  onSelectBaud: (baud: number) => void;
  selectedCanBitrateKbps: number;
  onSelectCanBitrateKbps: (bitrate: number) => void;
  connection: HardwareConnectionInfo;
  canActive: boolean;
  framesObserved: number;
  diagnosticResponderReady: boolean;
  error: string | null;
  busy: boolean;
  onRefresh: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenCan: () => void;
  onCloseCan: () => void;
  advancedDetails?: ReactNode;
};

const SERIAL_BAUDS = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
const CAN_RATES = [10, 20, 50, 100, 125, 250, 500, 800, 1000];

export function HardwareConnectionCentre({
  activeProvider,
  onSelectProvider,
  availablePorts,
  selectedPort,
  onSelectPort,
  selectedBaud,
  onSelectBaud,
  selectedCanBitrateKbps,
  onSelectCanBitrateKbps,
  connection,
  canActive,
  framesObserved,
  diagnosticResponderReady,
  error,
  busy,
  onRefresh,
  onConnect,
  onDisconnect,
  onOpenCan,
  onCloseCan,
  advancedDetails,
}: Props) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [simplified, setSimplified] = useState(
    () => loadExperienceSettings().mode === "simplified",
  );

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.mode === "simplified" || detail?.mode === "advanced") {
        setSimplified(detail.mode === "simplified");
      }
    };
    window.addEventListener("nexus:experience-settings", sync);
    return () => window.removeEventListener("nexus:experience-settings", sync);
  }, []);

  const adapterReady = connection.connected;
  const networkReady = adapterReady && canActive && framesObserved > 0;
  const ecuReady = networkReady && diagnosticResponderReady;

  const stages = useMemo(() => [
    { id: "adapter", label: "Select Adapter", complete: Boolean(activeProvider) },
    { id: "connect", label: "Connect", complete: adapterReady },
    { id: "network", label: "Detect Network", complete: networkReady },
    { id: "ecu", label: "Identify ECU", complete: ecuReady },
    { id: "session", label: "Start Session", complete: sessionStarted && ecuReady },
    { id: "ready", label: "Ready", complete: sessionStarted && ecuReady },
  ], [activeProvider, adapterReady, networkReady, ecuReady, sessionStarted]);

  const currentIndex = Math.min(
    stages.findIndex(stage => !stage.complete) === -1
      ? stages.length - 1
      : stages.findIndex(stage => !stage.complete),
    stages.length - 1,
  );

  const progress = Math.round(
    (stages.filter(stage => stage.complete).length / stages.length) * 100,
  );

  const nextMessage = !adapterReady
    ? "Choose your adapter and interface, then connect to the vehicle."
    : !canActive
      ? "The adapter is connected. Open the CAN receive monitor to detect the vehicle network."
      : framesObserved <= 0
        ? "NEXUS is listening. Confirm the vehicle connection, ignition state and CAN bitrate."
        : !diagnosticResponderReady
          ? "Vehicle traffic is present. Waiting for a standard diagnostic ECU responder."
          : !sessionStarted
            ? "ECU evidence is available. Start the read-only session when ready."
            : "Hardware connection flow is complete.";

  return (
    <section className={`hardware-connection-centre ${simplified ? "simple" : "advanced"}`}>
      <header className="hardware-centre-hero">
        <div>
          <span className="eyebrow">HARDWARE CONNECTION</span>
          <h2>Connect to a Vehicle</h2>
          <p>{simplified
            ? "Follow the steps below. NEXUS will only show the controls you need."
            : "Configure the interface, verify the live vehicle network and establish a controlled read-only ECU session."}</p>
        </div>
        <div className={`hardware-centre-state ${sessionStarted && ecuReady ? "ready" : "waiting"}`}>
          {sessionStarted && ecuReady ? <CheckCircle2 size={14} /> : <CircleHelp size={14} />}
          {sessionStarted && ecuReady ? "READY" : `${progress}%`}
        </div>
      </header>

      <div className="hardware-centre-progress">
        {stages.map((stage, index) => (
          <div key={stage.id} className={`${stage.complete ? "complete" : index === currentIndex ? "active" : "blocked"}`}>
            <span>{stage.complete ? <CheckCircle2 size={13} /> : index + 1}</span>
            <strong>{stage.label}</strong>
          </div>
        ))}
      </div>

      <section className="hardware-centre-current">
        <div className="hardware-centre-current-title">
          {currentIndex === 0 ? <Usb size={18} /> : currentIndex === 1 ? <PlugZap size={18} /> : currentIndex === 2 ? <Radio size={18} /> : currentIndex === 3 ? <Cpu size={18} /> : <ShieldCheck size={18} />}
          <div>
            <span className="eyebrow">CURRENT STEP</span>
            <h3>{stages[currentIndex].label}</h3>
          </div>
        </div>

        <p className="hardware-centre-guidance">{nextMessage}</p>

        {!adapterReady && (
          <div className="hardware-centre-form">
            <label>
              <span>ADAPTER / PROVIDER</span>
              <select value={activeProvider} onChange={event => onSelectProvider(event.target.value as TransportProviderId)}>
                {ADAPTER_PROFILES.map(profile => (
                  <option key={profile.providerId} value={profile.providerId}>
                    {profile.displayName} — {profile.supportState.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>INTERFACE / COM PORT</span>
              <select value={selectedPort} disabled={availablePorts.length === 0} onChange={event => onSelectPort(event.target.value)}>
                {availablePorts.length === 0
                  ? <option value="">No interfaces detected</option>
                  : availablePorts.map(port => <option key={port} value={port}>{port}</option>)}
              </select>
            </label>

            {!simplified && (
              <label>
                <span>SERIAL BAUD</span>
                <select value={selectedBaud} onChange={event => onSelectBaud(Number(event.target.value))}>
                  {SERIAL_BAUDS.map(rate => <option key={rate} value={rate}>{rate.toLocaleString()}</option>)}
                </select>
              </label>
            )}

            <div className="hardware-centre-actions">
              <button type="button" onClick={onRefresh} disabled={busy}>
                <RefreshCw size={13} /> SCAN
              </button>
              <button type="button" className="primary" onClick={onConnect} disabled={busy || !selectedPort}>
                <PlugZap size={13} /> CONNECT
              </button>
            </div>
          </div>
        )}

        {adapterReady && !networkReady && (
          <div className="hardware-centre-form compact">
            <div className="hardware-centre-summary-row">
              <span>CONNECTED INTERFACE</span>
              <strong>{connection.portName ?? selectedPort}</strong>
            </div>
            <label>
              <span>CAN BITRATE</span>
              <select value={selectedCanBitrateKbps} onChange={event => onSelectCanBitrateKbps(Number(event.target.value))}>
                {CAN_RATES.map(rate => <option key={rate} value={rate}>{rate} KBIT/S</option>)}
              </select>
            </label>
            <div className="hardware-centre-actions">
              <button type="button" className="danger" onClick={onDisconnect} disabled={busy}>DISCONNECT</button>
              {canActive ? (
                <button type="button" onClick={onCloseCan} disabled={busy}>STOP NETWORK SCAN</button>
              ) : (
                <button type="button" className="primary" onClick={onOpenCan} disabled={busy}>DETECT VEHICLE NETWORK</button>
              )}
            </div>
          </div>
        )}

        {networkReady && !ecuReady && (
          <div className="hardware-centre-detection">
            <Radio size={16} />
            <div><strong>Vehicle network detected</strong><span>{framesObserved.toLocaleString()} CAN frame(s) observed. NEXUS is waiting for ECU responder evidence.</span></div>
          </div>
        )}

        {ecuReady && !sessionStarted && (
          <div className="hardware-centre-detection good">
            <Cpu size={16} />
            <div><strong>ECU responder detected</strong><span>Start a controlled read-only session to complete the hardware connection flow.</span></div>
            <button type="button" className="primary" onClick={() => setSessionStarted(true)}>START READ-ONLY SESSION</button>
          </div>
        )}

        {sessionStarted && ecuReady && (
          <div className="hardware-centre-ready">
            <CheckCircle2 size={22} />
            <div><strong>Vehicle connection ready</strong><span>The live adapter, vehicle network and diagnostic responder have been confirmed.</span></div>
          </div>
        )}

        {error && (
          <div className="hardware-centre-error">
            <CircleAlert size={14} />
            <div><strong>Connection problem</strong><span>{error}</span></div>
          </div>
        )}
      </section>

      {!simplified && advancedDetails && (
        <details className="hardware-centre-advanced">
          <summary><ChevronDown size={13} /> ADVANCED HARDWARE TOOLS</summary>
          <div>{advancedDetails}</div>
        </details>
      )}
    </section>
  );
}
