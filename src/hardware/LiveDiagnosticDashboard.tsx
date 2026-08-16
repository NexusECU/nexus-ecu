import {
  Activity,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clock3,
  Cpu,
  Gauge,
  Network,
  Radio,
} from "lucide-react";

import {
  useMemo,
  useState,
  useEffect,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import "./live-diagnostic-dashboard.css";

type Props = {
  connection:
    HardwareConnectionInfo;

  frames:
    CanFrame[];

  adapterDetected:
    boolean;

  canMonitorActive:
    boolean;

  bitrateKbps:
    number | null;

  vin:
    string | null;

  calibrationIds:
    string[];

  lastError:
    string | null;

  lastActivityMs:
    number | null;
};

type Health =
  | "green"
  | "yellow"
  | "red"
  | "gray";

function idHex(
  id: number,
): string {
  return `0x${id
    .toString(16)
    .toUpperCase()
    .padStart(
      id > 0x7ff
        ? 8
        : 3,
      "0",
    )}`;
}

export function LiveDiagnosticDashboard({
  connection,
  frames,
  adapterDetected,
  canMonitorActive,
  bitrateKbps,
  vin,
  calibrationIds,
  lastError,
  lastActivityMs,
}: Props) {
  const [
    connectedAt,
    setConnectedAt,
  ] = useState<
    number | null
  >(
    null,
  );

  const [
    now,
    setNow,
  ] = useState(
    Date.now(),
  );

  useEffect(
    () => {
      if (
        connection.connected &&
        connectedAt === null
      ) {
        setConnectedAt(
          Date.now(),
        );
      }

      if (
        !connection.connected &&
        connectedAt !== null
      ) {
        setConnectedAt(
          null,
        );
      }
    },
    [
      connection.connected,
      connectedAt,
    ],
  );

  useEffect(
    () => {
      const id =
        window.setInterval(
          () =>
            setNow(
              Date.now(),
            ),
          1000,
        );

      return () =>
        window.clearInterval(
          id,
        );
    },
    [],
  );

  const uniqueIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            frames.map(
              frame =>
                frame.id,
            ),
          ),
        ).sort(
          (
            a,
            b,
          ) =>
            a - b,
        ),
      [
        frames,
      ],
    );

  const diagnosticResponses =
    useMemo(
      () =>
        uniqueIds.filter(
          id =>
            id >= 0x7e8 &&
            id <= 0x7ef,
        ),
      [
        uniqueIds,
      ],
    );

  const recentFrames =
    useMemo(
      () =>
        frames.filter(
          frame =>
            now -
              frame.timestampMs <=
            1000,
        ),
      [
        frames,
        now,
      ],
    );

  const connectionSeconds =
    connectedAt === null
      ? 0
      : Math.floor(
          (
            now -
            connectedAt
          ) /
            1000,
        );

  const lastActivityAge =
    lastActivityMs === null
      ? null
      : Math.max(
          0,
          Math.floor(
            (
              now -
              lastActivityMs
            ) /
              1000,
          ),
        );

  const health:
    Health =
      lastError
        ? "red"
        : connection.connected &&
          canMonitorActive &&
          frames.length > 0
          ? "green"
          : adapterDetected
            ? "yellow"
            : "gray";

  const eventLog =
    useMemo(
      () => {
        const items:
          string[] = [];

        if (
          adapterDetected
        ) {
          items.push(
            "Supported adapter detected",
          );
        }

        if (
          connection.connected
        ) {
          items.push(
            "Hardware link connected",
          );
        }

        if (
          canMonitorActive
        ) {
          items.push(
            "CAN receive monitor active",
          );
        }

        if (
          frames.length > 0
        ) {
          items.push(
            `${frames.length} CAN frame(s) observed`,
          );
        }

        if (
          diagnosticResponses.length >
          0
        ) {
          items.push(
            `Diagnostic response activity: ${diagnosticResponses
              .map(idHex)
              .join(" · ")}`,
          );
        }

        if (
          vin
        ) {
          items.push(
            `VIN decoded: ${vin}`,
          );
        }

        if (
          calibrationIds.length >
          0
        ) {
          items.push(
            `Calibration ID: ${calibrationIds.join(" · ")}`,
          );
        }

        if (
          lastError
        ) {
          items.push(
            `Transport error: ${lastError}`,
          );
        }

        return items;
      },
      [
        adapterDetected,
        connection.connected,
        canMonitorActive,
        frames.length,
        diagnosticResponses,
        vin,
        calibrationIds,
        lastError,
      ],
    );

  return (
    <section className="live-diagnostic-dashboard">
      <div className="live-diagnostic-dashboard-header">
        <div>
          <Gauge
            size={16}
          />

          <div>
            <span className="eyebrow">
              LIVE DIAGNOSTIC DASHBOARD · V7.4
            </span>

            <h3>
              Hardware / ECU Live Status
            </h3>
          </div>
        </div>

        <div className={`live-health ${health}`}>
          {health === "green" ? (
            <CheckCircle2 size={13}/>
          ) : health === "red" ? (
            <CircleAlert size={13}/>
          ) : health === "yellow" ? (
            <Activity size={13}/>
          ) : (
            <CircleHelp size={13}/>
          )}

          {health === "green"
            ? "HEALTHY"
            : health === "red"
              ? "ERROR"
              : health === "yellow"
                ? "PARTIAL"
                : "OFFLINE"}
        </div>
      </div>

      <div className="live-diagnostic-metrics">
        <Metric
          icon={<Clock3 size={12}/>}
          label="CONNECTED"
          value={
            connection.connected
              ? `${connectionSeconds}s`
              : "NO"
          }
        />

        <Metric
          icon={<Radio size={12}/>}
          label="RX RATE"
          value={
            `${recentFrames.length} FPS`
          }
        />

        <Metric
          icon={<Network size={12}/>}
          label="UNIQUE IDS"
          value={
            String(
              uniqueIds.length,
            )
          }
        />

        <Metric
          icon={<Cpu size={12}/>}
          label="DIAG RESPONSES"
          value={
            String(
              diagnosticResponses.length,
            )
          }
        />

        <Metric
          icon={<Gauge size={12}/>}
          label="BITRATE"
          value={
            bitrateKbps
              ? `${bitrateKbps}K`
              : "UNKNOWN"
          }
        />

        <Metric
          icon={<Activity size={12}/>}
          label="LAST ACTIVITY"
          value={
            lastActivityAge === null
              ? "NONE"
              : `${lastActivityAge}s AGO`
          }
        />
      </div>

      <div className="live-diagnostic-grid">
        <div className="live-diagnostic-card">
          <div className="live-diagnostic-card-title">
            NETWORK ACTIVITY
          </div>

          <div className="live-diagnostic-id-list">
            {uniqueIds.length
              ? uniqueIds
                  .slice(
                    0,
                    36,
                  )
                  .map(
                    id => (
                      <span
                        key={id}
                        className={
                          diagnosticResponses.includes(
                            id,
                          )
                            ? "diagnostic"
                            : ""
                        }
                      >
                        {idHex(id)}
                      </span>
                    ),
                  )
              : (
                <em>
                  No CAN identifiers observed.
                </em>
              )}
          </div>
        </div>

        <div className="live-diagnostic-card">
          <div className="live-diagnostic-card-title">
            VEHICLE / ECU IDENTITY
          </div>

          <Identity
            label="VIN"
            value={
              vin ??
              "UNKNOWN"
            }
          />

          <Identity
            label="CALIBRATION ID"
            value={
              calibrationIds.length
                ? calibrationIds.join(
                    " · ",
                  )
                : "UNKNOWN"
            }
          />

          <Identity
            label="DIAGNOSTIC IDS"
            value={
              diagnosticResponses.length
                ? diagnosticResponses
                    .map(idHex)
                    .join(" · ")
                : "NONE OBSERVED"
            }
          />
        </div>
      </div>

      <div className="live-diagnostic-events">
        <div className="live-diagnostic-card-title">
          SESSION EVENT LOG
        </div>

        {eventLog.length
          ? eventLog.map(
              (
                item,
                index,
              ) => (
                <div
                  key={`${item}-${index}`}
                >
                  <span>
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <strong>
                    {item}
                  </strong>
                </div>
              ),
            )
          : (
            <div className="live-diagnostic-empty">
              No hardware events observed yet.
            </div>
          )}
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>
        {icon}
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Identity({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="live-diagnostic-identity">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
