import {
  useMemo,
  useState,
} from "react";

import {
  Download,
  Filter,
  Radio,
  Trash2,
} from "lucide-react";

import type {
  CanFrame,
} from "./canParser";

import "./can-monitor.css";

type CanMonitorProps = {
  frames: CanFrame[];

  active: boolean;

  bitrateKbps:
    number | null;

  onClear: () => void;
};

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

function exportCanCsv(
  frames:
    CanFrame[],
) {
  if (
    frames.length ===
    0
  ) {
    return;
  }

  const header = [
    "time_ms",
    "id_hex",
    "id_decimal",
    "extended",
    "remote",
    "dlc",
    "data_hex",
    "raw",
  ];

  const first =
    frames[0]
      .timestampMs;

  const rows =
    frames.map(
      (frame) => [
        (
          frame.timestampMs -
          first
        ).toString(),
        frame.idHex,
        frame.id.toString(),
        frame.extended
          ? "true"
          : "false",
        frame.remote
          ? "true"
          : "false",
        frame.dlc.toString(),
        frame.data
          .map(
            hexByte,
          )
          .join(" "),
        `"${frame.raw}"`,
      ].join(","),
    );

  const blob =
    new Blob(
      [
        [
          header.join(
            ",",
          ),
          ...rows,
        ].join(
          "\n",
        ),
      ],
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

  link.href =
    url;

  link.download =
    `nexus-can-${Date.now()}.csv`;

  document.body.appendChild(
    link,
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url,
  );
}

export function CanMonitor({
  frames,
  active,
  bitrateKbps,
  onClear,
}: CanMonitorProps) {
  const [
    idFilter,
    setIdFilter,
  ] = useState("");

  const filtered =
    useMemo(
      () => {
        const filter =
          idFilter
            .trim()
            .toUpperCase()
            .replace(
              /^0X/,
              "",
            );

        if (!filter) {
          return frames;
        }

        return frames.filter(
          (frame) =>
            frame.idHex.includes(
              filter,
            ),
        );
      },
      [
        frames,
        idFilter,
      ],
    );

  const uniqueIds =
    useMemo(
      () =>
        new Set(
          frames.map(
            (frame) =>
              `${frame.extended ? "E" : "S"}:${frame.idHex}`,
          ),
        ).size,
      [
        frames,
      ],
    );

  const elapsedSeconds =
    frames.length >
    1
      ? Math.max(
          0.001,
          (
            frames[
              frames.length -
                1
            ].timestampMs -
            frames[0]
              .timestampMs
          ) /
            1000,
        )
      : 0;

  const framesPerSecond =
    elapsedSeconds > 0
      ? frames.length /
        elapsedSeconds
      : 0;

  return (
    <div className="can-monitor">
      <div className="can-monitor-header">
        <div>
          <span className="eyebrow">
            REAL CAN BUS
          </span>

          <h3>
            CAN Frame Monitor
          </h3>
        </div>

        <div
          className={`can-monitor-state ${
            active
              ? "active"
              : ""
          }`}
        >
          <Radio
            size={14}
          />

          {active
            ? `${bitrateKbps ?? 0} KBIT/S`
            : "CHANNEL CLOSED"}
        </div>
      </div>

      <div className="can-monitor-stats">
        <CanStat
          label="FRAMES"
          value={
            frames.length
              .toLocaleString()
          }
        />

        <CanStat
          label="UNIQUE IDS"
          value={
            uniqueIds.toString()
          }
        />

        <CanStat
          label="FRAME RATE"
          value={`${framesPerSecond.toFixed(
            1,
          )} FPS`}
        />

        <CanStat
          label="VISIBLE"
          value={
            filtered.length
              .toLocaleString()
          }
        />
      </div>

      <div className="can-monitor-toolbar">
        <label>
          <Filter
            size={13}
          />

          <input
            value={
              idFilter
            }
            placeholder="Filter CAN ID e.g. 7E8"
            onChange={(event) =>
              setIdFilter(
                event.target
                  .value,
              )
            }
          />
        </label>

        <button
          type="button"
          disabled={
            frames.length ===
            0
          }
          onClick={
            onClear
          }
        >
          <Trash2
            size={13}
          />

          CLEAR
        </button>

        <button
          type="button"
          disabled={
            frames.length ===
            0
          }
          onClick={() =>
            exportCanCsv(
              frames,
            )
          }
        >
          <Download
            size={13}
          />

          EXPORT CSV
        </button>
      </div>

      <div className="can-monitor-table-shell">
        <table className="can-monitor-table">
          <thead>
            <tr>
              <th>#</th>
              <th>TIME</th>
              <th>ID</th>
              <th>TYPE</th>
              <th>DLC</th>
              <th>DATA</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length ===
            0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="can-monitor-empty"
                >
                  {active
                    ? "Waiting for CAN frames…"
                    : "Open the CAN monitor to begin capture."}
                </td>
              </tr>
            ) : (
              filtered
                .slice(
                  -500,
                )
                .reverse()
                .map(
                  (
                    frame,
                    index,
                  ) => (
                    <tr
                      key={`${frame.timestampMs}-${index}`}
                    >
                      <td>
                        {frames.length -
                          index}
                      </td>

                      <td>
                        {frames[0]
                          ? (
                              frame.timestampMs -
                              frames[0]
                                .timestampMs
                            ).toFixed(
                              0,
                            )
                          : "0"}{" "}
                        ms
                      </td>

                      <td className="can-id">
                        0x
                        {frame.idHex}
                      </td>

                      <td>
                        {frame.extended
                          ? "29 BIT"
                          : "11 BIT"}
                        {frame.remote
                          ? " RTR"
                          : ""}
                      </td>

                      <td>
                        {frame.dlc}
                      </td>

                      <td className="can-data">
                        {frame.remote
                          ? "REMOTE REQUEST"
                          : frame.data
                              .map(
                                hexByte,
                              )
                              .join(
                                " ",
                              )}
                      </td>
                    </tr>
                  ),
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CanStat({
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
