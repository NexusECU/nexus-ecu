import {
  Activity,
  Cable,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Network,
  Power,
  RefreshCcw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import type {
  TransportProviderId,
} from "./transportTypes";

import {
  buildProtocolChannelSnapshot,
} from "./protocolChannelService";

import type {
  ChannelState,
  ProtocolChannelEvent,
} from "./protocolChannelTypes";

import "./protocol-channel-manager.css";

type Props = {
  providerId:
    TransportProviderId;

  transportConnected:
    boolean;

  frames:
    CanFrame[];

  bitrateKbps:
    number | null;

  error:
    string | null;
};

export function ProtocolChannelManagerPanel({
  providerId,
  transportConnected,
  frames,
  bitrateKbps,
  error,
}: Props) {
  const [
    requestedOpen,
    setRequestedOpen,
  ] = useState(
    false,
  );

  const [
    events,
    setEvents,
  ] = useState<
    ProtocolChannelEvent[]
  >([]);

  const previousState =
    useRef<
      ChannelState | null
    >(
      null,
    );

  useEffect(
    () => {
      if (
        !transportConnected
      ) {
        setRequestedOpen(
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
        buildProtocolChannelSnapshot(
          providerId,
          transportConnected,
          requestedOpen,
          frames,
          bitrateKbps,
          error,
        ),
      [
        providerId,
        transportConnected,
        requestedOpen,
        frames,
        bitrateKbps,
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
              `protocol-${Date.now()}-${previous.length}`,

            timestamp:
              new Date()
                .toISOString(),

            state:
              snapshot.state,

            title:
              channelLabel(
                snapshot.state,
              ),

            detail:
              snapshot.statusText,
          },
          ...previous,
        ].slice(
          0,
          30,
        ),
      );
    },
    [
      snapshot.state,
      snapshot.statusText,
    ],
  );

  return (
    <section className="protocol-channel-manager">
      <div className="protocol-channel-manager-header">
        <div>
          <Network
            size={16}
          />

          <div>
            <span className="eyebrow">
              PROTOCOL & CHANNEL MANAGEMENT
            </span>

            <h3>
              ECU Communication Channel
            </h3>
          </div>
        </div>

        <div
          className={`protocol-channel-state ${snapshot.state}`}
        >
          {snapshot.state ===
          "open" ? (
            <CheckCircle2
              size={12}
            />
          ) : snapshot.state ===
            "error" ||
            snapshot.state ===
              "degraded" ? (
            <CircleAlert
              size={12}
            />
          ) : (
            <CircleHelp
              size={12}
            />
          )}

          {channelLabel(
            snapshot.state,
          )}
        </div>
      </div>

      <div className="protocol-channel-grid">
        <Info
          label="PROVIDER"
          value={
            snapshot.providerId.toUpperCase()
          }
        />

        <Info
          label="PROTOCOL FAMILY"
          value={
            snapshot.protocolFamily.toUpperCase()
          }
        />

        <Info
          label="ADDRESSING"
          value={
            snapshot.addressingMode.toUpperCase()
          }
        />

        <Info
          label="BITRATE"
          value={
            snapshot.bitrateKbps
              ? `${snapshot.bitrateKbps} KBIT/S`
              : "UNKNOWN"
          }
        />

        <Info
          label="RESPONDERS"
          value={
            snapshot.responderIds.length
              ? snapshot.responderIds.join(
                  " · ",
                )
              : "NONE"
          }
        />

        <Info
          label="FRAMES"
          value={
            snapshot.frameCount.toLocaleString()
          }
        />
      </div>

      <div className={`protocol-channel-status ${snapshot.state}`}>
        <Activity
          size={12}
        />

        <span>
          {snapshot.statusText}
        </span>
      </div>

      <div className="protocol-channel-actions">
        <button
          type="button"
          disabled={
            !transportConnected ||
            requestedOpen
          }
          onClick={() =>
            setRequestedOpen(
              true,
            )
          }
        >
          <Cable
            size={12}
          />

          OPEN CHANNEL
        </button>

        <button
          type="button"
          disabled={
            !requestedOpen
          }
          onClick={() =>
            setRequestedOpen(
              false,
            )
          }
        >
          <Power
            size={12}
          />

          CLOSE CHANNEL
        </button>

        <button
          type="button"
          disabled={
            !transportConnected
          }
          onClick={() => {
            setRequestedOpen(
              false,
            );

            window.setTimeout(
              () =>
                setRequestedOpen(
                  true,
                ),
              0,
            );
          }}
        >
          <RefreshCcw
            size={12}
          />

          RESET CHANNEL STATE
        </button>
      </div>

      <div className="protocol-channel-events">
        <div className="protocol-channel-events-title">
          CHANNEL EVENTS
        </div>

        {events.length ? (
          events.map(
            event => (
              <div
                key={
                  event.id
                }
                className="protocol-channel-event"
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
          <div className="protocol-channel-empty">
            No protocol channel events yet.
          </div>
        )}
      </div>

      <div className="protocol-channel-footer"> manages protocol/channel state and observed bus
        evidence only. Opening a channel here does not add
        arbitrary CAN transmit, diagnostic control, security
        access, memory write or programming operations.
      </div>
    </section>
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

function channelLabel(
  state:
    ChannelState,
): string {
  switch (
    state
  ) {
    case "opening":
      return "OPENING";

    case "open":
      return "CHANNEL OPEN";

    case "degraded":
      return "DEGRADED";

    case "error":
      return "ERROR";

    default:
      return "CHANNEL CLOSED";
  }
}
