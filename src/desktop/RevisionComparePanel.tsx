import {
  ArrowRight,
  CheckSquare,
  CopyCheck,
  GitCompareArrows,
  Square,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

import type {
  MapKind,
} from "../maps/mapTypes";

import type {
  NexusProject,
} from "./projectTypes";

import "./revision-compare.css";

type RevisionSourceId =
  | "current"
  | string;

export type RevisionCompareCell = {
  row: number;
  column: number;
};

type RevisionComparePanelProps = {
  project: NexusProject;
  currentMaps: CalibrationSet["maps"];

  onApplyCells: (
    mapKind: MapKind,
    sourceRevisionId: string,
    cells: RevisionCompareCell[],
  ) => void;
};

type RevisionSource = {
  id: RevisionSourceId;
  name: string;
  maps: CalibrationSet["maps"];
};

function sourceForId(
  id: RevisionSourceId,
  project: NexusProject,
  currentMaps: CalibrationSet["maps"],
): RevisionSource | null {
  if (
    id === "current"
  ) {
    return {
      id,
      name: "Current Calibration",
      maps: currentMaps,
    };
  }

  const revision =
    project.revisions.find(
      (item) =>
        item.id === id,
    );

  if (!revision) {
    return null;
  }

  return {
    id:
      revision.id,
    name:
      revision.name,
    maps:
      revision.maps,
  };
}

function cellKey(
  row: number,
  column: number,
): string {
  return `${row}:${column}`;
}

function mapLabel(
  kind: MapKind,
): string {
  if (kind === "fuel") {
    return "Fuel";
  }

  if (kind === "ignition") {
    return "Ignition";
  }

  return "Boost";
}

function formatValue(
  value: number,
): string {
  if (
    Math.abs(
      value,
    ) >= 100
  ) {
    return value.toFixed(
      0,
    );
  }

  return value.toFixed(
    2,
  );
}

export function RevisionComparePanel({
  project,
  currentMaps,
  onApplyCells,
}: RevisionComparePanelProps) {
  const revisions =
    project.revisions;

  const defaultLeft =
    revisions.length >= 2
      ? revisions[
          revisions.length - 2
        ].id
      : revisions[
          revisions.length - 1
        ]?.id ??
        "current";

  const defaultRight =
    revisions.length >= 1
      ? revisions[
          revisions.length - 1
        ].id
      : "current";

  const [
    leftId,
    setLeftId,
  ] = useState<RevisionSourceId>(
    defaultLeft,
  );

  const [
    rightId,
    setRightId,
  ] = useState<RevisionSourceId>(
    defaultRight,
  );

  const [
    mapKind,
    setMapKind,
  ] = useState<MapKind>(
    "fuel",
  );

  const [
    selectedCells,
    setSelectedCells,
  ] = useState<Set<string>>(
    new Set(),
  );

  const left =
    sourceForId(
      leftId,
      project,
      currentMaps,
    );

  const right =
    sourceForId(
      rightId,
      project,
      currentMaps,
    );

  const comparison =
    useMemo(
      () => {
        if (
          !left ||
          !right
        ) {
          return {
            changed:
              [] as RevisionCompareCell[],
            increased: 0,
            decreased: 0,
            total: 0,
          };
        }

        const leftMap =
          left.maps[
            mapKind
          ];

        const rightMap =
          right.maps[
            mapKind
          ];

        const changed:
          RevisionCompareCell[] = [];

        let increased = 0;
        let decreased = 0;
        let total = 0;

        rightMap.values.forEach(
          (
            row,
            rowIndex,
          ) => {
            row.forEach(
              (
                value,
                columnIndex,
              ) => {
                const before =
                  leftMap.values[
                    rowIndex
                  ]?.[
                    columnIndex
                  ];

                if (
                  before === undefined
                ) {
                  return;
                }

                total++;

                if (
                  Math.abs(
                    value -
                    before,
                  ) >
                  0.000001
                ) {
                  changed.push({
                    row:
                      rowIndex,
                    column:
                      columnIndex,
                  });

                  if (
                    value >
                    before
                  ) {
                    increased++;
                  } else {
                    decreased++;
                  }
                }
              },
            );
          },
        );

        return {
          changed,
          increased,
          decreased,
          total,
        };
      },
      [
        left,
        right,
        mapKind,
      ],
    );

  const changedSet =
    useMemo(
      () =>
        new Set(
          comparison.changed.map(
            (cell) =>
              cellKey(
                cell.row,
                cell.column,
              ),
          ),
        ),
      [
        comparison.changed,
      ],
    );

  const changedPercent =
    comparison.total >
    0
      ? comparison.changed.length /
        comparison.total *
        100
      : 0;

  const toggleCell = (
    row: number,
    column: number,
  ) => {
    const key =
      cellKey(
        row,
        column,
      );

    if (
      !changedSet.has(
        key,
      )
    ) {
      return;
    }

    setSelectedCells(
      (previous) => {
        const next =
          new Set(
            previous,
          );

        if (
          next.has(
            key,
          )
        ) {
          next.delete(
            key,
          );
        } else {
          next.add(
            key,
          );
        }

        return next;
      },
    );
  };

  const selectAllChanged =
    () => {
      setSelectedCells(
        new Set(
          comparison.changed.map(
            (cell) =>
              cellKey(
                cell.row,
                cell.column,
              ),
          ),
        ),
      );
    };

  const clearSelection =
    () => {
      setSelectedCells(
        new Set(),
      );
    };

  const applySelected =
    () => {
      if (
        rightId === "current" ||
        selectedCells.size ===
          0
      ) {
        return;
      }

      const cells =
        comparison.changed.filter(
          (cell) =>
            selectedCells.has(
              cellKey(
                cell.row,
                cell.column,
              ),
            ),
        );

      onApplyCells(
        mapKind,
        rightId,
        cells,
      );

      clearSelection();
    };

  if (
    revisions.length ===
    0
  ) {
    return (
      <div className="revision-compare-empty">
        Create at least one calibration revision to use
        Revision Compare.
      </div>
    );
  }

  const leftMap =
    left?.maps[
      mapKind
    ];

  const rightMap =
    right?.maps[
      mapKind
    ];

  if (
    !leftMap ||
    !rightMap
  ) {
    return null;
  }

  return (
    <section className="revision-compare">
      <div className="revision-compare-header">
        <div>
          <span className="eyebrow">
            REVISION ANALYSIS
          </span>

          <h3>
            Revision Compare
          </h3>

          <p>
            Compare saved calibrations cell-by-cell and
            selectively copy values from the right-hand
            revision into the current tune.
          </p>
        </div>

        <GitCompareArrows
          size={20}
        />
      </div>

      <div className="revision-compare-controls">
        <label>
          <span>
            REVISION A
          </span>

          <select
            value={
              leftId
            }
            onChange={(event) => {
              setLeftId(
                event.target.value,
              );
              clearSelection();
            }}
          >
            <option value="current">
              Current Calibration
            </option>

            {revisions.map(
              (revision) => (
                <option
                  key={
                    revision.id
                  }
                  value={
                    revision.id
                  }
                >
                  {revision.name}
                </option>
              ),
            )}
          </select>
        </label>

        <ArrowRight
          size={16}
        />

        <label>
          <span>
            REVISION B / SOURCE
          </span>

          <select
            value={
              rightId
            }
            onChange={(event) => {
              setRightId(
                event.target.value,
              );
              clearSelection();
            }}
          >
            <option value="current">
              Current Calibration
            </option>

            {revisions.map(
              (revision) => (
                <option
                  key={
                    revision.id
                  }
                  value={
                    revision.id
                  }
                >
                  {revision.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>
            MAP
          </span>

          <select
            value={
              mapKind
            }
            onChange={(event) => {
              setMapKind(
                event.target.value as MapKind,
              );
              clearSelection();
            }}
          >
            <option value="fuel">
              Fuel
            </option>

            <option value="ignition">
              Ignition
            </option>

            <option value="boost">
              Boost
            </option>
          </select>
        </label>
      </div>

      <div className="revision-compare-stats">
        <div>
          <span>
            CHANGED CELLS
          </span>

          <strong>
            {comparison.changed.length}
          </strong>
        </div>

        <div>
          <span>
            MAP CHANGED
          </span>

          <strong>
            {changedPercent.toFixed(
              1,
            )}
            %
          </strong>
        </div>

        <div className="increase">
          <span>
            INCREASED
          </span>

          <strong>
            {comparison.increased}
          </strong>
        </div>

        <div className="decrease">
          <span>
            DECREASED
          </span>

          <strong>
            {comparison.decreased}
          </strong>
        </div>

        <div>
          <span>
            SELECTED
          </span>

          <strong>
            {selectedCells.size}
          </strong>
        </div>
      </div>

      <div className="revision-compare-toolbar">
        <button
          type="button"
          disabled={
            comparison.changed.length ===
            0
          }
          onClick={
            selectAllChanged
          }
        >
          <CheckSquare
            size={13}
          />

          SELECT ALL CHANGED
        </button>

        <button
          type="button"
          disabled={
            selectedCells.size ===
            0
          }
          onClick={
            clearSelection
          }
        >
          <Square
            size={13}
          />

          CLEAR
        </button>

        <span />

        <button
          type="button"
          className="primary"
          disabled={
            rightId ===
              "current" ||
            selectedCells.size ===
              0
          }
          onClick={
            applySelected
          }
        >
          <CopyCheck
            size={13}
          />

          APPLY SELECTED B → CURRENT
        </button>
      </div>

      <div className="revision-compare-map-title">
        <strong>
          {mapLabel(
            mapKind,
          )}
        </strong>

        <span>
          {left.name}
          {""}
          →{""}
          {right.name}
        </span>
      </div>

      <div className="revision-compare-table-shell">
        <table className="revision-compare-table">
          <thead>
            <tr>
              <th>
                RPM \ LOAD
              </th>

              {rightMap.xAxis.values.map(
                (
                  load,
                  column,
                ) => (
                  <th
                    key={`${load}-${column}`}
                  >
                    {load}
                    %
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {rightMap.values.map(
              (
                row,
                rowIndex,
              ) => (
                <tr
                  key={
                    rowIndex
                  }
                >
                  <th>
                    {rightMap.yAxis.values[
                      rowIndex
                    ]?.toLocaleString() ??
                      rowIndex}
                  </th>

                  {row.map(
                    (
                      value,
                      columnIndex,
                    ) => {
                      const before =
                        leftMap.values[
                          rowIndex
                        ]?.[
                          columnIndex
                        ];

                      const key =
                        cellKey(
                          rowIndex,
                          columnIndex,
                        );

                      const changed =
                        changedSet.has(
                          key,
                        );

                      const selected =
                        selectedCells.has(
                          key,
                        );

                      const delta =
                        before ===
                        undefined
                          ? 0
                          : value -
                            before;

                      return (
                        <td
                          key={
                            columnIndex
                          }
                          className={`${
                            changed
                              ? delta >
                                0
                                ? "changed increase"
                                : "changed decrease"
                              : ""
                          } ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleCell(
                              rowIndex,
                              columnIndex,
                            )
                          }
                        >
                          <strong>
                            {formatValue(
                              value,
                            )}
                          </strong>

                          {changed &&
                            before !==
                              undefined && (
                              <>
                                <small>
                                  A{""}
                                  {formatValue(
                                    before,
                                  )}
                                </small>

                                <em>
                                  Δ{""}
                                  {delta >
                                  0
                                    ? "+"
                                    : ""}
                                  {formatValue(
                                    delta,
                                  )}
                                </em>
                              </>
                            )}
                        </td>
                      );
                    },
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="revision-compare-footer">
        Only explicitly selected changed cells are copied.
        Revision files themselves are never modified by this
        operation.
      </div>
    </section>
  );
}
