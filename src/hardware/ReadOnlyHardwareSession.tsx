import {
  Activity,
  Cable,
  CheckCircle2,
  CircleHelp,
  Cpu,
  Eye,
  Radio,
  ShieldCheck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import {
  analyseReadOnlyHardwareSession,
} from "./readOnlySessionAnalysis";

import {
  getTransportProvider,
} from "./transportRegistry";

import type {
  TransportProviderId,
} from "./transportTypes";

import "./read-only-hardware-session.css";

type Props = {
  providerId:
    TransportProviderId;

  connection:
    HardwareConnectionInfo;

  frames:
    CanFrame[];

  canMonitorActive:
    boolean;

  bitrateKbps:
    number | null;

  lastActivityMs:
    number | null;

  adapterDetected:
    boolean;
};

export function ReadOnlyHardwareSession({
  providerId,
  connection,
  frames,
  canMonitorActive,
  bitrateKbps,
  lastActivityMs,
  adapterDetected,
}: Props) {
  const [
    sessionStartedAt,
    setSessionStartedAt,
  ] = useState<
    number | null
  >(
    null,
  );

  const provider =
    getTransportProvider(
      providerId,
    );

  const snapshot =
    useMemo(
      () =>
        analyseReadOnlyHardwareSession(
          providerId,
          connection,
          frames,
          canMonitorActive,
          bitrateKbps,
          lastActivityMs,
        ),
      [
        providerId,
        connection,
        frames,
        canMonitorActive,
        bitrateKbps,
        lastActivityMs,
      ],
    );

  const sessionActive =
    sessionStartedAt !==
    null;

  const durationSeconds =
    sessionStartedAt ===
    null
      ? 0
      : Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              sessionStartedAt
            ) /
              1000,
          ),
        );

  const providerReadCapable =
    provider?.capabilities.some(
      (capability) =>
        capability.read,
    ) ??
    false;

  const providerWriteEnabled =
    provider?.capabilities.some(
      (capability) =>
        capability.write,
    ) ??
    false;

  return (
    <section className="readonly-session">
      <div className="readonly-session-header">
        <div>
          <Eye
            size={16}
          />

          <div>
            <span className="eyebrow">
              READ-ONLY HARDWARE SESSION · V7.0
            </span>

            <h3>
              Live ECU Observation
            </h3>
          </div>
        </div>

        <div className="readonly-session-lock">
          <ShieldCheck
            size={13}
          />

          TRANSMIT / FLASH DISABLED
        </div>
      </div>

      <div className="readonly-session-toolbar">
        {sessionActive ? (
          <button
            type="button"
            className="stop"
            onClick={() =>
              setSessionStartedAt(
                null,
              )
            }
          >
            STOP OBSERVATION SESSION
          </button>
        ) : (
          <button
            type="button"
            disabled={
              !providerReadCapable ||
              !adapterDetected
            }
            onClick={() =>
              setSessionStartedAt(
                Date.now(),
              )
            }
          >
            START READ-ONLY SESSION
          </button>
        )}

        <span>
          PROVIDER
          {" "}
          <strong>
            {provider?.shortName ??
              providerId.toUpperCase()}
          </strong>
        </span>

        <span>
          SESSION
          {" "}
          <strong>
            {sessionActive
              ? `${durationSeconds}s`
              : "STOPPED"}
          </strong>
        </span>
      </div>

      {!adapterDetected && (
        <div className="readonly-no-adapter">
          <CircleHelp size={15} />

          <div>
            <strong>
              NO SUPPORTED ADAPTER DETECTED
            </strong>

            <span>
              ECU identity, protocol, bitrate and live traffic
              remain UNKNOWN until you explicitly select and
              connect a supported interface.
            </span>
          </div>
        </div>
      )}

      <div className="readonly-session-stats">
        <Stat
          label="ADAPTER"
          value={
            adapterDetected
              ? "DETECTED"
              : "NOT DETECTED"
          }
        />

        <Stat
          label="LINK"
          value={
            connection.connected
              ? "CONNECTED"
              : "NONE"
          }
        />

        <Stat
          label="CAN RX"
          value={
            !adapterDetected
              ? "NONE"
              : canMonitorActive
                ? "ACTIVE"
                : "INACTIVE"
          }
        />

        <Stat
          label="BITRATE"
          value={
            !adapterDetected
              ? "UNKNOWN"
              : bitrateKbps
                ? `${bitrateKbps} KBIT/S`
                : "UNKNOWN"
          }
        />

        <Stat
          label="FRAMES"
          value={
            snapshot.frameCount.toLocaleString()
          }
        />

        <Stat
          label="UNIQUE IDS"
          value={
            snapshot.uniqueCanIds.toString()
          }
        />

        <Stat
          label="RX RATE"
          value={
            `${snapshot.framesPerSecond} FPS`
          }
        />

        <Stat
          label="BYTES RX"
          value={
            snapshot.bytesReceived.toLocaleString()
          }
        />

        <Stat
          label="WRITE PATH"
          value={
            providerWriteEnabled
              ? "REGISTRY ONLY"
              : "DISABLED"
          }
        />
      </div>

      <div className="readonly-session-evidence">
        <div className="readonly-session-card">
          <div className="readonly-session-card-title">
            <Cpu
              size={13}
            />

            ECU IDENTITY EVIDENCE
          </div>

          <div
            className={`readonly-identity ${
              adapterDetected
                ? snapshot.identityConfidence
                : "none"
            }`}
          >
            {snapshot.identityConfidence ===
            "observed" ? (
              <CheckCircle2
                size={15}
              />
            ) : snapshot.identityConfidence ===
              "partial" ? (
              <Activity
                size={15}
              />
            ) : (
              <CircleHelp
                size={15}
              />
            )}

            <div>
              <strong>
                {adapterDetected
                  ? snapshot.identityConfidence.toUpperCase()
                  : "UNKNOWN"}
              </strong>

              <span>
                {adapterDetected
                  ? snapshot.identitySummary
                  : "No supported adapter is connected."}
              </span>
            </div>
          </div>
        </div>

        <div className="readonly-session-card">
          <div className="readonly-session-card-title">
            <Radio
              size={13}
            />

            PROTOCOL EVIDENCE
          </div>

          {snapshot.protocolEvidence.length >
          0 ? (
            <div className="readonly-evidence-list">
              {snapshot.protocolEvidence.map(
                (item) => (
                  <span
                    key={
                      item
                    }
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          ) : (
            <div className="readonly-session-empty">
              No protocol evidence captured yet.
            </div>
          )}
        </div>
      </div>

      <div className="readonly-session-id-grid">
        <div>
          <span>
            DIAGNOSTIC REQUEST IDS
          </span>

          <strong>
            {snapshot.diagnosticRequestIds.length
              ? snapshot.diagnosticRequestIds.join(
                  " · ",
                )
              : "NONE OBSERVED"}
          </strong>
        </div>

        <div>
          <span>
            DIAGNOSTIC RESPONSE IDS
          </span>

          <strong>
            {snapshot.diagnosticResponseIds.length
              ? snapshot.diagnosticResponseIds.join(
                  " · ",
                )
              : "NONE OBSERVED"}
          </strong>
        </div>

        <div>
          <span>
            STANDARD / EXTENDED
          </span>

          <strong>
            {snapshot.standardFrames.toLocaleString()}
            {" / "}
            {snapshot.extendedFrames.toLocaleString()}
          </strong>
        </div>
      </div>

      <div className="readonly-session-note">
        <Cable
          size={13}
        />

        v7.0 does not actively request VIN, calibration IDs,
        diagnostic sessions or memory reads. Identity shown
        here is based only on provider status and traffic
        NEXUS has actually observed.
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
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
