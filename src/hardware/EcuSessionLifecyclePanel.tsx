import {
  Activity,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clock3,
  Play,
  Power,
  RotateCcw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildEcuSessionLifecycleSnapshot,
} from "./ecuSessionLifecycleService";

import type {
  EcuSessionLifecycleEvent,
  EcuSessionLifecycleState,
} from "./ecuSessionLifecycleTypes";

import "./ecu-session-lifecycle.css";

type Props = {
  transportConnected:
    boolean;

  ecuResponderDetected:
    boolean;

  identityConfirmed:
    boolean;

  lastActivityMs:
    number | null;

  error:
    string | null;
};

export function EcuSessionLifecyclePanel({
  transportConnected,
  ecuResponderDetected,
  identityConfirmed,
  lastActivityMs,
  error,
}: Props) {
  const [
    sessionStarted,
    setSessionStarted,
  ] = useState(
    false,
  );

  const [
    manuallyClosed,
    setManuallyClosed,
  ] = useState(
    false,
  );

  const [
    now,
    setNow,
  ] = useState(
    Date.now(),
  );

  const [
    events,
    setEvents,
  ] = useState<
    EcuSessionLifecycleEvent[]
  >([]);

  const previousState =
    useRef<
      EcuSessionLifecycleState | null
    >(
      null,
    );

  useEffect(
    () => {
      const timer =
        window.setInterval(
          () =>
            setNow(
              Date.now(),
            ),
          1000,
        );

      return () =>
        window.clearInterval(
          timer,
        );
    },
    [],
  );

  useEffect(
    () => {
      if (
        !transportConnected
      ) {
        setSessionStarted(
          false,
        );

        setManuallyClosed(
          false,
        );
      }
    },
    [
      transportConnected,
    ],
  );

  const snapshot =
    useMemo(
      () =>
        buildEcuSessionLifecycleSnapshot(
          transportConnected,
          ecuResponderDetected,
          identityConfirmed,
          sessionStarted,
          manuallyClosed,
          lastActivityMs,
          now,
          error,
        ),
      [
        transportConnected,
        ecuResponderDetected,
        identityConfirmed,
        sessionStarted,
        manuallyClosed,
        lastActivityMs,
        now,
        error,
      ],
    );

  useEffect(
    () => {
      if (
        previousState.current ===
        snapshot.state
      ) {
        return;
      }

      previousState.current =
        snapshot.state;

      setEvents(
        previous => [
          {
            id:
              `lifecycle-${Date.now()}-${previous.length}`,

            timestamp:
              new Date()
                .toISOString(),

            state:
              snapshot.state,

            title:
              stateLabel(
                snapshot.state,
              ),

            detail:
              snapshot.statusText,
          },
          ...previous,
        ].slice(
          0,
          40,
        ),
      );
    },
    [
      snapshot.state,
      snapshot.statusText,
    ],
  );

  const startSession =
    () => {
      if (
        !transportConnected ||
        !ecuResponderDetected ||
        !identityConfirmed
      ) {
        return;
      }

      setManuallyClosed(
        false,
      );

      setSessionStarted(
        true,
      );
  };

  const closeSession =
    () => {
      setSessionStarted(
        false,
      );

      setManuallyClosed(
        true,
      );
  };

  const recoverSession =
    () => {
      setManuallyClosed(
        false,
      );

      setSessionStarted(
        identityConfirmed,
      );

      setNow(
        Date.now(),
      );
  };

  return (
    <section className="ecu-session-lifecycle">
      <div className="ecu-session-lifecycle-header">
        <div>
          <Activity
            size={16}
          />

          <div>
            <span className="eyebrow">
              ECU SESSION LIFECYCLE · V9.2
            </span>

            <h3>
              Runtime Session State
            </h3>
          </div>
        </div>

        <LifecycleBadge
          state={
            snapshot.state
          }
        />
      </div>

      <div className="ecu-session-lifecycle-flow">
        {[
          "disconnected",
          "transport-connected",
          "ecu-detected",
          "identified",
          "active",
        ].map(
          (
            state,
            index,
          ) => (
            <div
              key={
                state
              }
              className={
                snapshot.state ===
                  state
                  ? "active"
                  : ""
              }
            >
              <span>
                {index + 1}
              </span>

              <strong>
                {stateLabel(
                  state as EcuSessionLifecycleState,
                )}
              </strong>
            </div>
          ),
        )}
      </div>

      <div className="ecu-session-lifecycle-grid">
        <Info
          label="TRANSPORT"
          value={
            snapshot.transportConnected
              ? "CONNECTED"
              : "DISCONNECTED"
          }
        />

        <Info
          label="ECU RESPONDER"
          value={
            snapshot.ecuResponderDetected
              ? "DETECTED"
              : "UNKNOWN"
          }
        />

        <Info
          label="IDENTITY"
          value={
            snapshot.identityConfirmed
              ? "CONFIRMED"
              : "INCOMPLETE"
          }
        />

        <Info
          label="SESSION"
          value={
            snapshot.sessionActive
              ? "ACTIVE"
              : "INACTIVE"
          }
        />

        <Info
          label="IDLE"
          value={
            snapshot.idleMs ===
            null
              ? "UNKNOWN"
              : `${Math.round(
                  snapshot.idleMs /
                    1000,
                )} SEC`
          }
        />

        <Info
          label="TIMEOUT"
          value={
            `${Math.round(
              snapshot.timeoutThresholdMs /
                1000,
            )} SEC`
          }
        />
      </div>

      <div className={`ecu-session-lifecycle-status ${snapshot.state}`}>
        {snapshot.state ===
        "active" ? (
          <CheckCircle2
            size={13}
          />
        ) : snapshot.state ===
          "error" ||
          snapshot.state ===
            "timed-out" ? (
          <CircleAlert
            size={13}
          />
        ) : (
          <CircleHelp
            size={13}
          />
        )}

        <span>
          {snapshot.statusText}
        </span>
      </div>

      <div className="ecu-session-lifecycle-actions">
        <button
          type="button"
          disabled={
            snapshot.state !==
            "identified"
          }
          onClick={
            startSession
          }
        >
          <Play
            size={12}
          />

          START READ-ONLY SESSION
        </button>

        <button
          type="button"
          disabled={
            snapshot.state !==
            "active"
          }
          onClick={
            closeSession
          }
        >
          <Power
            size={12}
          />

          CLOSE SESSION
        </button>

        <button
          type="button"
          disabled={
            snapshot.state !==
              "timed-out" &&
            snapshot.state !==
              "error" &&
            snapshot.state !==
              "closed"
          }
          onClick={
            recoverSession
          }
        >
          <RotateCcw
            size={12}
          />

          RECOVER SESSION STATE
        </button>
      </div>

      <div className="ecu-session-lifecycle-timeline">
        <div className="ecu-session-lifecycle-title">
          <Clock3
            size={12}
          />

          SESSION STATE TIMELINE
        </div>

        {events.length ? (
          events.map(
            event => (
              <div
                key={
                  event.id
                }
                className="ecu-session-lifecycle-event"
              >
                <span>
                  {new Date(
                    event.timestamp,
                  ).toLocaleTimeString()}
                </span>

                <strong>
                  {event.title}
                </strong>

                <em>
                  {event.detail}
                </em>
              </div>
            ),
          )
        ) : (
          <div className="ecu-session-lifecycle-empty">
            No lifecycle events yet.
          </div>
        )}
      </div>

      <div className="ecu-session-lifecycle-footer">
        v9.2 formalizes read-only session state only. It does
        not transmit diagnostic-session control, security
        access, memory-write or programming commands.
      </div>
    </section>
  );
}

function LifecycleBadge({
  state,
}: {
  state:
    EcuSessionLifecycleState;
}) {
  return (
    <div className={`ecu-session-lifecycle-badge ${state}`}>
      {stateLabel(
        state,
      )}
    </div>
  );
}

function Info({
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

function stateLabel(
  state:
    EcuSessionLifecycleState,
): string {
  switch (
    state
  ) {
    case "transport-connected":
      return "TRANSPORT CONNECTED";

    case "ecu-detected":
      return "ECU DETECTED";

    case "identified":
      return "IDENTIFIED";

    case "active":
      return "SESSION ACTIVE";

    case "timed-out":
      return "TIMED OUT";

    case "error":
      return "ERROR";

    case "closed":
      return "CLOSED";

    default:
      return "DISCONNECTED";
  }
}
