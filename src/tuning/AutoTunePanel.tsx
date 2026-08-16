import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";

import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

import type {
  EcuMap,
} from "../maps/mapTypes";

import type {
  LogSample,
} from "../logging/DataLogger";

import "./auto-tune.css";

type AutoTuneCell = {
  row: number;

  column: number;

  rpm: number;

  load: number;

  hits: number;

  averageAfrError: number;

  suggestedPercent: number;

  currentValue: number;

  suggestedValue: number;

  locked: boolean;
};

type AutoTuneProps = {
  samples: LogSample[];

  maps: CalibrationSet["maps"];

  onApplyFuelMap: (
    map: EcuMap,
  ) => void;
};

function cloneMap(
  map: EcuMap,
): EcuMap {
  return {
    ...map,

    xAxis: {
      ...map.xAxis,
      values: [
        ...map.xAxis.values,
      ],
    },

    yAxis: {
      ...map.yAxis,
      values: [
        ...map.yAxis.values,
      ],
    },

    values:
      map.values.map(
        (row) => [
          ...row,
        ],
      ),
  };
}

function nearestIndex(
  values: number[],
  target: number,
): number {
  let bestIndex = 0;
  let bestDistance =
    Number.POSITIVE_INFINITY;

  values.forEach(
    (
      value,
      index,
    ) => {
      const distance =
        Math.abs(
          value -
          target,
        );

      if (
        distance <
        bestDistance
      ) {
        bestDistance =
          distance;
        bestIndex =
          index;
      }
    },
  );

  return bestIndex;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value,
    ),
  );
}

export function AutoTunePanel({
  samples,
  maps,
  onApplyFuelMap,
}: AutoTuneProps) {
  const [
    minimumHits,
    setMinimumHits,
  ] = useState(4);

  const [
    maximumCorrection,
    setMaximumCorrection,
  ] = useState(8);

  const [
    rejectedCells,
    setRejectedCells,
  ] = useState<
    Set<string>
  >(
    new Set(),
  );

  const fuelMap =
    maps.fuel;

  const cells =
    useMemo(() => {
      const buckets =
        new Map<
          string,
          {
            row: number;
            column: number;
            rpm: number;
            load: number;
            errors: number[];
            locked: boolean;
          }
        >();

      samples.forEach(
        (sample) => {
          if (
            sample.targetAfr ===
              undefined ||
            sample.engineLoad ===
              undefined
          ) {
            return;
          }

          const row =
            nearestIndex(
              fuelMap.yAxis
                .values,
              sample.rpm,
            );

          const column =
            nearestIndex(
              fuelMap.xAxis
                .values,
              sample.engineLoad,
            );

          const key =
            `${row}:${column}`;

          const bucket =
            buckets.get(
              key,
            ) ?? {
              row,
              column,
              rpm:
                fuelMap.yAxis
                  .values[
                    row
                  ],
              load:
                fuelMap.xAxis
                  .values[
                    column
                  ],
              errors: [],
              locked: false,
            };

          bucket.errors.push(
            sample.afr -
              sample.targetAfr,
          );

          const unsafe =
            sample.events?.some(
              (event) =>
                event ===
                  "knock" ||
                event ===
                  "protection" ||
                event ===
                  "fault",
            ) ?? false;

          bucket.locked =
            bucket.locked ||
            unsafe;

          buckets.set(
            key,
            bucket,
          );
        },
      );

      return Array.from(
        buckets.values(),
      ).map(
        (
          bucket,
        ): AutoTuneCell => {
          const averageAfrError =
            bucket.errors.reduce(
              (
                total,
                value,
              ) =>
                total +
                value,
              0,
            ) /
            Math.max(
              1,
              bucket.errors
                .length,
            );

          /*
           * Simple simulator correction model:
           * lean (+ AFR error) -> add fuel
           * rich (- AFR error) -> remove fuel
           */
          const rawPercent =
            averageAfrError *
            4.2;

          const suggestedPercent =
            clamp(
              rawPercent,
              -maximumCorrection,
              maximumCorrection,
            );

          const currentValue =
            fuelMap.values[
              bucket.row
            ]?.[
              bucket.column
            ] ??
            14.7;

          const suggestedValue =
            clamp(
              currentValue -
                averageAfrError *
                  0.65,
              fuelMap.minimum,
              fuelMap.maximum,
            );

          return {
            row:
              bucket.row,
            column:
              bucket.column,
            rpm:
              bucket.rpm,
            load:
              bucket.load,
            hits:
              bucket.errors
                .length,
            averageAfrError,
            suggestedPercent,
            currentValue,
            suggestedValue,
            locked:
              bucket.locked,
          };
        },
      );
    }, [
      samples,
      fuelMap,
      maximumCorrection,
    ]);

  const eligibleCells =
    cells.filter(
      (cell) =>
        cell.hits >=
          minimumHits &&
        !cell.locked &&
        !rejectedCells.has(
          `${cell.row}:${cell.column}`,
        ),
    );

  const unsafeCells =
    cells.filter(
      (cell) =>
        cell.locked,
    ).length;

  const totalHits =
    cells.reduce(
      (
        total,
        cell,
      ) =>
        total +
        cell.hits,
      0,
    );

  const averageAbsoluteError =
    cells.length > 0
      ? cells.reduce(
          (
            total,
            cell,
          ) =>
            total +
            Math.abs(
              cell.averageAfrError,
            ),
          0,
        ) /
        cells.length
      : 0;

  const applyCells = (
    targetCells:
      AutoTuneCell[],
  ) => {
    const next =
      cloneMap(
        fuelMap,
      );

    targetCells.forEach(
      (cell) => {
        next.values[
          cell.row
        ][
          cell.column
        ] =
          cell.suggestedValue;
      },
    );

    onApplyFuelMap(
      next,
    );
  };

  const rejectCell = (
    cell:
      AutoTuneCell,
  ) => {
    const key =
      `${cell.row}:${cell.column}`;

    setRejectedCells(
      (previous) => {
        const next =
          new Set(
            previous,
          );

        next.add(
          key,
        );

        return next;
      },
    );
  };

  const resetRejected =
    () => {
      setRejectedCells(
        new Set(),
      );
    };

  return (
    <section className="autotune-panel">
      <div className="autotune-header">
        <div>
          <span className="eyebrow">
            LIVE TUNING
          </span>

          <h2>
            AFR Auto-Tune
          </h2>

          <p className="profile-description">
            Analyse logged AFR error by fuel-map cell,
            build correction confidence from hit counts,
            and apply suggested fuel-map changes.
          </p>
        </div>

        <div className="autotune-state">
          <Sparkles
            size={15}
          />

          {samples.length > 0
            ? "ANALYSIS READY"
            : "WAITING FOR LOG"}
        </div>
      </div>

      <div className="autotune-summary">
        <SummaryItem
          label="LOG SAMPLES"
          value={samples.length.toLocaleString()}
        />

        <SummaryItem
          label="CELL HITS"
          value={totalHits.toLocaleString()}
        />

        <SummaryItem
          label="ELIGIBLE CELLS"
          value={`${eligibleCells.length}`}
        />

        <SummaryItem
          label="UNSAFE CELLS"
          value={`${unsafeCells}`}
        />

        <SummaryItem
          label="AVG AFR ERROR"
          value={averageAbsoluteError.toFixed(
            2,
          )}
        />

        <SummaryItem
          label="MAX CORRECTION"
          value={`${maximumCorrection}%`}
        />
      </div>

      <div className="autotune-controls">
        <label>
          <span>
            MINIMUM HITS
          </span>

          <input
            type="number"
            min={1}
            max={50}
            value={
              minimumHits
            }
            onChange={(event) =>
              setMinimumHits(
                clamp(
                  Number(
                    event.target.value,
                  ),
                  1,
                  50,
                ),
              )
            }
          />
        </label>

        <label>
          <span>
            MAX CORRECTION %
          </span>

          <input
            type="number"
            min={1}
            max={20}
            value={
              maximumCorrection
            }
            onChange={(event) =>
              setMaximumCorrection(
                clamp(
                  Number(
                    event.target.value,
                  ),
                  1,
                  20,
                ),
              )
            }
          />
        </label>

        <button
          type="button"
          disabled={
            eligibleCells.length ===
            0
          }
          onClick={() =>
            applyCells(
              eligibleCells,
            )
          }
        >
          <CheckCircle2
            size={14}
          />

          APPLY ALL
        </button>

        <button
          type="button"
          onClick={
            resetRejected
          }
        >
          <RefreshCw
            size={14}
          />

          RESET REJECTIONS
        </button>
      </div>

      <div className="autotune-table-shell">
        <table className="autotune-table">
          <thead>
            <tr>
              <th>RPM</th>
              <th>LOAD</th>
              <th>HITS</th>
              <th>AFR ERROR</th>
              <th>CURRENT</th>
              <th>SUGGESTED</th>
              <th>CORRECTION</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {cells.length ===
            0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="autotune-empty"
                >
                  Start a log and run the engine to
                  generate Auto-Tune data.
                </td>
              </tr>
            ) : (
              cells
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    b.hits -
                    a.hits,
                )
                .map(
                  (cell) => {
                    const key =
                      `${cell.row}:${cell.column}`;

                    const rejected =
                      rejectedCells.has(
                        key,
                      );

                    const enoughHits =
                      cell.hits >=
                      minimumHits;

                    const ready =
                      enoughHits &&
                      !cell.locked &&
                      !rejected;

                    return (
                      <tr
                        key={
                          key
                        }
                        className={
                          cell.locked
                            ? "locked"
                            : ready
                              ? "ready"
                              : ""
                        }
                      >
                        <td>
                          {cell.rpm.toLocaleString()}
                        </td>

                        <td>
                          {cell.load}%
                        </td>

                        <td>
                          {cell.hits}
                        </td>

                        <td>
                          {cell.averageAfrError >
                          0
                            ? "+"
                            : ""}
                          {cell.averageAfrError.toFixed(
                            2,
                          )}
                        </td>

                        <td>
                          {cell.currentValue.toFixed(
                            2,
                          )}
                        </td>

                        <td>
                          {cell.suggestedValue.toFixed(
                            2,
                          )}
                        </td>

                        <td>
                          {cell.suggestedPercent >
                          0
                            ? "+"
                            : ""}
                          {cell.suggestedPercent.toFixed(
                            1,
                          )}%
                        </td>

                        <td>
                          {cell.locked ? (
                            <span className="autotune-badge unsafe">
                              <ShieldAlert
                                size={12}
                              />

                              SAFETY LOCK
                            </span>
                          ) : rejected ? (
                            <span className="autotune-badge rejected">
                              REJECTED
                            </span>
                          ) : ready ? (
                            <span className="autotune-badge ready">
                              READY
                            </span>
                          ) : (
                            <span className="autotune-badge">
                              MORE DATA
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="autotune-actions">
                            <button
                              type="button"
                              disabled={
                                !ready
                              }
                              onClick={() =>
                                applyCells([
                                  cell,
                                ])
                              }
                            >
                              <CheckCircle2
                                size={13}
                              />

                              APPLY
                            </button>

                            <button
                              type="button"
                              disabled={
                                cell.locked
                              }
                              onClick={() =>
                                rejectCell(
                                  cell,
                                )
                              }
                            >
                              <XCircle
                                size={13}
                              />

                              REJECT
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
            )}
          </tbody>
        </table>
      </div>

      <div className="autotune-note">
        <Gauge
          size={15}
        />

        Auto-Tune suggestions are generated from simulated
        AFR error. Cells touched during knock, protection or
        sensor-fault events are locked from automatic apply.
      </div>
    </section>
  );
}

function SummaryItem({
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
