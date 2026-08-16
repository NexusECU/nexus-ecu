import {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Gauge,
  Search,
  Signal,
} from "lucide-react";

import type {
  CanFrame,
} from "./canParser";

import {
  formatSignalValue,
  latestDecodedSignals,
} from "./canSignals";

import "./can-signals.css";

type CanSignalPanelProps = {
  frames: CanFrame[];

  canActive: boolean;
};

export function CanSignalPanel({
  frames,
  canActive,
}: CanSignalPanelProps) {
  const [
    search,
    setSearch,
  ] = useState("");

  const signals =
    useMemo(
      () =>
        latestDecodedSignals(
          frames,
        ),
      [
        frames,
      ],
    );

  const visibleSignals =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return signals;
        }

        return signals.filter(
          (signal) =>
            signal.name
              .toLowerCase()
              .includes(
                term,
              ) ||
            signal.shortName
              .toLowerCase()
              .includes(
                term,
              ) ||
            signal.sourceId
              .toLowerCase()
              .includes(
                term,
              ) ||
            signal.pid
              .toString(
                16,
              )
              .toLowerCase()
              .includes(
                term,
              ),
        );
      },
      [
        signals,
        search,
      ],
    );

  const newestTimestamp =
    signals.reduce(
      (
        newest,
        signal,
      ) =>
        Math.max(
          newest,
          signal.timestampMs,
        ),
      0,
    );

  return (
    <div className="can-signals">
      <div className="can-signals-header">
        <div>
          <span className="eyebrow">
            PASSIVE SIGNAL DECODING
          </span>

          <h3>
            Live OBD-II Signals
          </h3>

          <p>
            Decodes supported Mode 01 response frames that
            are already present in captured CAN traffic.
          </p>
        </div>

        <div
          className={`can-signals-state ${
            canActive
              ? "active"
              : ""
          }`}
        >
          <Signal
            size={14}
          />

          {canActive
            ? "DECODER ACTIVE"
            : "CAN CLOSED"}
        </div>
      </div>

      <div className="can-signals-summary">
        <div>
          <span>
            DECODED SIGNALS
          </span>

          <strong>
            {signals.length}
          </strong>
        </div>

        <div>
          <span>
            SOURCE
          </span>

          <strong>
            MODE 01 RESPONSES
          </strong>
        </div>

        <div>
          <span>
            REQUEST MODE
          </span>

          <strong>
            PASSIVE ONLY
          </strong>
        </div>

        <div>
          <span>
            LAST DECODE
          </span>

          <strong>
            {newestTimestamp >
            0
              ? "RECEIVED"
              : "—"}
          </strong>
        </div>
      </div>

      <div className="can-signals-search">
        <Search
          size={13}
        />

        <input
          value={
            search
          }
          placeholder="Search RPM, coolant, 7E8, PID…"
          onChange={(event) =>
            setSearch(
              event.target
                .value,
            )
          }
        />
      </div>

      {visibleSignals.length ===
      0 ? (
        <div className="can-signals-empty">
          <Gauge
            size={26}
          />

          <strong>
            No supported diagnostic signals detected yet
          </strong>

          <span>
            NEXUS is listening for standard Mode 01 response
            frames such as RPM, speed, coolant, throttle,
            MAP, MAF and control-module voltage.
          </span>
        </div>
      ) : (
        <div className="can-signals-grid">
          {visibleSignals.map(
            (signal) => (
              <div
                key={
                  signal.key
                }
                className="can-signal-card"
              >
                <div className="can-signal-card-header">
                  <span>
                    {signal.shortName}
                  </span>

                  <Activity
                    size={12}
                  />
                </div>

                <div className="can-signal-value">
                  <strong>
                    {formatSignalValue(
                      signal,
                    )}
                  </strong>

                  <span>
                    {signal.unit}
                  </span>
                </div>

                <div className="can-signal-name">
                  {signal.name}
                </div>

                <div className="can-signal-meta">
                  <span>
                    PID 0x
                    {signal.pid
                      .toString(
                        16,
                      )
                      .toUpperCase()
                      .padStart(
                        2,
                        "0",
                      )}
                  </span>

                  <span>
                    {signal.sourceId}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <div className="can-signals-note">
        NEXUS does not send OBD requests. Values appear
        only when another tester/module has caused compatible
        Mode 01 responses to be present on the monitored CAN
        traffic.
      </div>
    </div>
  );
}
