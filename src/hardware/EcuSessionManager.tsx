import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clock3,
  Cpu,
  LockKeyhole,
  Network,
  ShieldCheck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import {
  buildEcuSessionSnapshot,
} from "./ecuSessionService";

import type {
  EcuSessionTimelineEntry,
} from "./ecuSessionTypes";

import "./ecu-session-manager.css";

type Props = {
  frames:
    CanFrame[];

  adapterReady:
    boolean;

  linkReady:
    boolean;

  bitrateKbps:
    number | null;

  vin:
    string | null;

  calibrationIds:
    string[];
};

function idHex(
  id: number,
): string {
  return `0x${id
    .toString(16)
    .toUpperCase()
    .padStart(
      id >
      0x7ff
        ? 8
        : 3,
      "0",
    )}`;
}

export function EcuSessionManager({
  frames,
  adapterReady,
  linkReady,
  bitrateKbps,
  vin,
  calibrationIds,
}: Props) {
  const responders =
    useMemo(
      () =>
        Array.from(
          new Set(
            frames
              .map(
                frame =>
                  frame.id,
              )
              .filter(
                id =>
                  id >= 0x7e8 &&
                  id <= 0x7ef,
              ),
          ),
        ).map(
          idHex,
        ),
      [
        frames,
      ],
    );

  const [
    selectedEcuAddress,
    setSelectedEcuAddress,
  ] = useState(
    responders[0] ??
    "AUTO",
  );

  const [
    timeline,
    setTimeline,
  ] = useState<
    EcuSessionTimelineEntry[]
  >([]);

  const protocol =
    bitrateKbps
      ? `CAN / ${bitrateKbps} KBIT/S`
      : "UNKNOWN";

  const snapshot =
    useMemo(
      () =>
        buildEcuSessionSnapshot(
          selectedEcuAddress,
          protocol,
          vin,
          calibrationIds,
          adapterReady,
          linkReady,
          responders,
        ),
      [
        selectedEcuAddress,
        protocol,
        vin,
        calibrationIds,
        adapterReady,
        linkReady,
        responders,
      ],
    );

  const addTimeline =
    (
      label:
        string,
      detail:
        string,
    ) => {
      setTimeline(
        previous => [
          ...previous,
          {
            id:
              `session-${Date.now()}-${previous.length}`,
            timestamp:
              new Date()
                .toISOString(),
            label,
            detail,
          },
        ],
      );
    };

  const beginSession =
    () => {
      addTimeline(
        "Session started",
        `ECU ${selectedEcuAddress} · ${protocol}`,
      );
    };

  const clearSession =
    () => {
      setTimeline(
        [],
      );
    };

  return (
    <section className="ecu-session-manager">
      <div className="ecu-session-manager-header">
        <div>
          <Cpu
            size={16}
          />

          <div>
            <span className="eyebrow">
              ECU SESSION MANAGER
            </span>

            <h3>
              Read-Only ECU Session
            </h3>
          </div>
        </div>

        <div
          className={`ecu-session-readiness ${
            snapshot.readiness
          }`}
        >
          {snapshot.readiness ===
          "ready" ? (
            <CheckCircle2
              size={13}
            />
          ) : snapshot.readiness ===
            "partial" ? (
            <CircleHelp
              size={13}
            />
          ) : (
            <CircleAlert
              size={13}
            />
          )}

          {snapshot.readiness.toUpperCase()}
        </div>
      </div>

      <div className="ecu-session-summary">
        <Summary
          label="ECU ADDRESS"
          value={
            snapshot.selectedEcuAddress
          }
        />

        <Summary
          label="PROTOCOL"
          value={
            snapshot.protocol
          }
        />

        <Summary
          label="VIN"
          value={
            snapshot.vin
          }
        />

        <Summary
          label="CALIBRATION ID"
          value={
            snapshot.calibrationId
          }
        />
      </div>

      <div className="ecu-session-controls">
        <label>
          <span>
            SELECT ECU
          </span>

          <select
            value={
              selectedEcuAddress
            }
            onChange={
              event =>
                setSelectedEcuAddress(
                  event.target.value,
                )
            }
          >
            <option value="AUTO">
              AUTO / FIRST RESPONDER
            </option>

            {responders.map(
              address => (
                <option
                  key={
                    address
                  }
                  value={
                    address
                  }
                >
                  {address}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          disabled={
            snapshot.readiness ===
            "blocked"
          }
          onClick={
            beginSession
          }
        >
          <ShieldCheck
            size={12}
          />

          START READ-ONLY SESSION
        </button>

        <button
          type="button"
          disabled={
            timeline.length ===
            0
          }
          onClick={
            clearSession
          }
        >
          CLEAR TIMELINE
        </button>
      </div>

      <div className="ecu-session-gates">
        <Gate
          icon={<Network size={12}/>}
          label="ADAPTER READY"
          ok={
            snapshot.adapterReady
          }
        />

        <Gate
          icon={<Network size={12}/>}
          label="LINK READY"
          ok={
            snapshot.linkReady
          }
        />

        <Gate
          icon={<Cpu size={12}/>}
          label="ECU RESPONDER"
          ok={
            snapshot.diagnosticsReady
          }
        />

        <Gate
          icon={<ShieldCheck size={12}/>}
          label="IDENTITY EVIDENCE"
          ok={
            snapshot.identityReady
          }
        />
      </div>

      <div className="ecu-session-lock">
        <LockKeyhole
          size={13}
        />

        <div>
          <strong>
            OPERATION GATE
          </strong>

          <span>
            {snapshot.operationLockReason}
          </span>
        </div>
      </div>

      <div className="ecu-session-timeline">
        <div className="ecu-session-timeline-title">
          <Clock3
            size={12}
          />

          SESSION TIMELINE
        </div>

        {timeline.length ? (
          timeline.map(
            entry => (
              <div
                key={
                  entry.id
                }
                className="ecu-session-timeline-entry"
              >
                <span>
                  {entry.timestamp}
                </span>

                <strong>
                  {entry.label}
                </strong>

                <em>
                  {entry.detail}
                </em>
              </div>
            ),
          )
        ) : (
          <div className="ecu-session-empty">
            No ECU session events recorded yet.
          </div>
        )}
      </div>

      <div className="ecu-session-footer"> manages read-only ECU session state only. Memory
        writes, flash operations, security access and programming
        sessions remain locked.
      </div>
    </section>
  );
}

function Summary({
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

function Gate({
  icon,
  label,
  ok,
}: {
  icon:
    React.ReactNode;

  label:
    string;

  ok:
    boolean;
}) {
  return (
    <div
      className={
        ok
          ? "ok"
          : ""
      }
    >
      {icon}

      <span>
        {label}
      </span>

      <strong>
        {ok
          ? "PASS"
          : "BLOCKED"}
      </strong>
    </div>
  );
}
