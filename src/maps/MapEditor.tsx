import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  CircleDot,
} from "lucide-react";

import type {
  EcuMap,
} from "./mapTypes";

import type {
  LogSample,
} from "../logging/DataLogger";

import {
  applyToSelection,
  cellIsSelected,
  cloneEcuMap,
  formatMapValue,
  interpolateSelection,
  mapAverage,
  mapDisplayName,
  mapUnit,
  normaliseSelection,
  smoothSelection,
  type MapCell,
  type MapSelection,
} from "./mapUtilities";

import {
  MapToolbar,
} from "./MapToolbar";

import {
  AdvancedCalibrationTools,
} from "./AdvancedCalibrationTools";

import "./tuning-workspace.css";
import "./advanced-calibration-tools.css";

export type MapTracePoint = {
  rpm: number;
  loadPercent: number;
};

type MapEditorProps = {
  map: EcuMap;

  onChange: (
    map: EcuMap,
  ) => void;

  livePoint?: MapTracePoint | null;

  tracePoint?: MapTracePoint | null;

  logSamples?: LogSample[];
};

type ClipboardData = {
  width: number;

  height: number;

  values: number[][];
};

function nearestAxisIndex(
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
        bestIndex =
          index;

        bestDistance =
          distance;
      }
    },
  );

  return bestIndex;
}

function interpolationIndexes(
  values: number[],
  target: number,
): number[] {
  if (
    values.length <= 1
  ) {
    return [0];
  }

  if (
    target <= values[0]
  ) {
    return [0];
  }

  if (
    target >=
    values[
      values.length - 1
    ]
  ) {
    return [
      values.length - 1,
    ];
  }

  for (
    let index = 0;
    index <
    values.length - 1;
    index++
  ) {
    if (
      target >=
        values[index] &&
      target <=
        values[index + 1]
    ) {
      return [
        index,
        index + 1,
      ];
    }
  }

  return [
    nearestAxisIndex(
      values,
      target,
    ),
  ];
}

function sameMapValues(
  a: EcuMap,
  b: EcuMap,
): boolean {
  if (
    a.values.length !==
    b.values.length
  ) {
    return false;
  }

  for (
    let row = 0;
    row < a.values.length;
    row++
  ) {
    if (
      a.values[row].length !==
      b.values[row].length
    ) {
      return false;
    }

    for (
      let column = 0;
      column <
        a.values[row].length;
      column++
    ) {
      if (
        Math.abs(
          a.values[row][
            column
          ] -
          b.values[row][
            column
          ],
        ) >
        0.000001
      ) {
        return false;
      }
    }
  }

  return true;
}

export function MapEditor({
  map,
  onChange,
  livePoint = null,
  tracePoint = null,
  logSamples = [],
}: MapEditorProps) {
  const [
    selection,
    setSelection,
  ] = useState<MapSelection>({
    start: {
      row: 0,
      column: 0,
    },

    end: {
      row: 0,
      column: 0,
    },
  });

  const [
    anchor,
    setAnchor,
  ] = useState<MapCell>({
    row: 0,
    column: 0,
  });

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    quickValue,
    setQuickValue,
  ] = useState("");

  const [
    customStep,
    setCustomStep,
  ] = useState(
    map.kind === "boost"
      ? 0.05
      : 0.1,
  );


  const [
    changedOnly,
    setChangedOnly,
  ] = useState(false);


  const [
    openEditorMenu,
    setOpenEditorMenu,
  ] = useState<
    "edit" | "view" | "help" | null
  >(null);

  const [
    editingXAxis,
    setEditingXAxis,
  ] = useState<number | null>(
    null,
  );

  const [
    editingYAxis,
    setEditingYAxis,
  ] = useState<number | null>(
    null,
  );

  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    viewMode,
    setViewMode,
  ] = useState<
    "table" | "surface"
  >(
    "table",
  );

  const [
    compare,
    setCompare,
  ] = useState(false);

  const [
    undoStack,
    setUndoStack,
  ] = useState<EcuMap[]>(
    [],
  );

  const [
    redoStack,
    setRedoStack,
  ] = useState<EcuMap[]>(
    [],
  );

  const clipboardRef =
    useRef<
      ClipboardData | null
    >(null);

  const baselineRef =
    useRef<EcuMap>(
      cloneEcuMap(
        map,
      ),
    );

  useEffect(() => {
    baselineRef.current =
      cloneEcuMap(
        map,
      );

    setUndoStack(
      [],
    );

    setRedoStack(
      [],
    );

    setSelection({
      start: {
        row: 0,
        column: 0,
      },

      end: {
        row: 0,
        column: 0,
      },
    });

    setAnchor({
      row: 0,
      column: 0,
    });

    setCompare(
      false,
    );
  }, [
    map.id,
  ]);

  const bounds =
    normaliseSelection(
      selection,
    );

  const selectedValue =
    map.values[
      selection.end.row
    ]?.[
      selection.end.column
    ] ?? 0;

  const selectedRpm =
    map.yAxis.values[
      selection.end.row
    ] ?? 0;

  const selectedLoad =
    map.xAxis.values[
      selection.end.column
    ] ?? 0;


  const selectedValues =
    map.values
      .slice(
        bounds.rowStart,
        bounds.rowEnd + 1,
      )
      .flatMap(
        (row) =>
          row.slice(
            bounds.columnStart,
            bounds.columnEnd + 1,
          ),
      );

  const selectionCount =
    selectedValues.length;

  const selectionMin =
    selectionCount > 0
      ? Math.min(
          ...selectedValues,
        )
      : selectedValue;

  const selectionMax =
    selectionCount > 0
      ? Math.max(
          ...selectedValues,
        )
      : selectedValue;

  const selectionAverage =
    selectionCount > 0
      ? selectedValues.reduce(
          (
            total,
            value,
          ) =>
            total + value,
          0,
        ) /
        selectionCount
      : selectedValue;

  const changed =
    !sameMapValues(
      map,
      baselineRef.current,
    );

  const commit = (
    next: EcuMap,
  ) => {
    setUndoStack(
      (previous) => [
        ...previous.slice(
          -39,
        ),
        cloneEcuMap(
          map,
        ),
      ],
    );

    setRedoStack(
      [],
    );

    onChange(
      next,
    );
  };

  const clickCell = (
    row: number,
    column: number,
    shiftKey: boolean,
  ) => {
    const cell = {
      row,
      column,
    };

    if (
      shiftKey
    ) {
      setSelection({
        start:
          anchor,

        end:
          cell,
      });

      return;
    }

    setAnchor(
      cell,
    );

    setSelection({
      start:
        cell,

      end:
        cell,
    });
  };

  const beginDragSelection = (
    row: number,
    column: number,
    shiftKey: boolean,
  ) => {
    const cell = {
      row,
      column,
    };

    editorRef.current?.focus();

    if (shiftKey) {
      setSelection({
        start: anchor,
        end: cell,
      });
    } else {
      setAnchor(cell);
      setSelection({
        start: cell,
        end: cell,
      });
    }

    setDragging(true);
  };

  const extendDragSelection = (
    row: number,
    column: number,
  ) => {
    if (!dragging) {
      return;
    }

    setSelection({
      start: anchor,
      end: {
        row,
        column,
      },
    });
  };

  const stopDragSelection =
    () => {
      setDragging(false);
    };

  const selectAllCells =
    () => {
      const start = {
        row: 0,
        column: 0,
      };

      const end = {
        row:
          Math.max(
            0,
            map.values.length - 1,
          ),
        column:
          Math.max(
            0,
            (map.values[0]?.length ?? 1) - 1,
          ),
      };

      setAnchor(start);
      setSelection({
        start,
        end,
      });
    };

  const moveSelection = (
    rowDelta: number,
    columnDelta: number,
    extend: boolean,
  ) => {
    const maxRow =
      Math.max(
        0,
        map.values.length - 1,
      );

    const maxColumn =
      Math.max(
        0,
        (map.values[0]?.length ?? 1) - 1,
      );

    const current =
      selection.end;

    const next = {
      row:
        Math.max(
          0,
          Math.min(
            maxRow,
            current.row + rowDelta,
          ),
        ),
      column:
        Math.max(
          0,
          Math.min(
            maxColumn,
            current.column + columnDelta,
          ),
        ),
    };

    if (extend) {
      setSelection({
        start: anchor,
        end: next,
      });
    } else {
      setAnchor(next);
      setSelection({
        start: next,
        end: next,
      });
    }
  };

  const selectionStep =
    customStep;

  const updateMapSelection = (
    sourceMap: EcuMap,
    targetSelection: MapSelection,
    updater: (
      value: number,
      row: number,
      column: number,
    ) => number,
  ): EcuMap => {
    const nextMap =
      cloneEcuMap(
        sourceMap,
      );

    const nextBounds =
      normaliseSelection(
        targetSelection,
      );

    for (
      let row =
        nextBounds.rowStart;
      row <=
      nextBounds.rowEnd;
      row++
    ) {
      for (
        let column =
          nextBounds.columnStart;
        column <=
        nextBounds.columnEnd;
        column++
      ) {
        const current =
          nextMap.values[
            row
          ]?.[
            column
          ];

        if (
          current ===
          undefined
        ) {
          continue;
        }

        nextMap.values[
          row
        ][
          column
        ] =
          updater(
            current,
            row,
            column,
          );
      }
    }

    return nextMap;
  };

  const setSelectionValue = (
    value: number,
  ) => {
    if (!Number.isFinite(value)) {
      return;
    }

    commit(
      updateMapSelection(
        map,
        selection,
        () => value,
      ),
    );
  };

  const multiplySelection = (
    multiplier: number,
  ) => {
    commit(
      updateMapSelection(
        map,
        selection,
        (value) =>
          value * multiplier,
      ),
    );
  };

  const divideSelection = (
    divisor: number,
  ) => {
    if (divisor === 0) {
      return;
    }

    multiplySelection(
      1 / divisor,
    );
  };

  const selectWholeRow = (
    row: number,
  ) => {
    const start = {
      row,
      column: 0,
    };

    const end = {
      row,
      column:
        Math.max(
          0,
          (map.values[row]?.length ?? 1) - 1,
        ),
    };

    setAnchor(start);
    setSelection({
      start,
      end,
    });

    editorRef.current?.focus();
  };

  const selectWholeColumn = (
    column: number,
  ) => {
    const start = {
      row: 0,
      column,
    };

    const end = {
      row:
        Math.max(
          0,
          map.values.length - 1,
        ),
      column,
    };

    setAnchor(start);
    setSelection({
      start,
      end,
    });

    editorRef.current?.focus();
  };

  const fillSelectionFromAnchor =
    () => {
      const source =
        map.values[
          anchor.row
        ]?.[
          anchor.column
        ];

      if (source === undefined) {
        return;
      }

      commit(
        updateMapSelection(
          map,
          selection,
          () => source,
        ),
      );
    };

  const applyQuickValue = () => {
    const parsed =
      Number(
        quickValue,
      );

    if (!Number.isFinite(parsed)) {
      return;
    }

    setSelectionValue(
      parsed,
    );

    setQuickValue(
      "",
    );
  };


  const updateXAxisValue = (
    column: number,
    value: number,
  ) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextMap =
      cloneEcuMap(
        map,
      );

    nextMap.xAxis.values[
      column
    ] = value;

    commit(
      nextMap,
    );
  };

  const updateYAxisValue = (
    row: number,
    value: number,
  ) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextMap =
      cloneEcuMap(
        map,
      );

    nextMap.yAxis.values[
      row
    ] = value;

    commit(
      nextMap,
    );
  };

  const baselineValueAt = (
    row: number,
    column: number,
  ) =>
    baselineRef.current.values[
      row
    ]?.[
      column
    ];

  const changedFromBaseline = (
    row: number,
    column: number,
  ) => {
    const baseline =
      baselineValueAt(
        row,
        column,
      );

    if (
      baseline === undefined
    ) {
      return false;
    }

    return (
      Math.abs(
        map.values[row][column] -
        baseline,
      ) >
      0.000001
    );
  };

  const setSelectionExact = (
    value: number,
  ) => {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      return;
    }

    commit(
      applyToSelection(
        map,
        selection,
        () =>
          value,
      ),
    );
  };

  const clampSelection = (
    minimum: number,
    maximum: number,
  ) => {
    if (
      !Number.isFinite(
        minimum,
      ) ||
      !Number.isFinite(
        maximum,
      )
    ) {
      return;
    }

    const low =
      Math.min(
        minimum,
        maximum,
      );

    const high =
      Math.max(
        minimum,
        maximum,
      );

    commit(
      applyToSelection(
        map,
        selection,
        (value) =>
          Math.max(
            low,
            Math.min(
              high,
              value,
            ),
          ),
      ),
    );
  };

  const roundSelection = (
    decimals: number,
  ) => {
    const safeDecimals =
      Math.max(
        0,
        Math.min(
          6,
          Math.round(
            decimals,
          ),
        ),
      );

    const factor =
      10 **
      safeDecimals;

    commit(
      applyToSelection(
        map,
        selection,
        (value) =>
          Math.round(
            value *
            factor,
          ) /
          factor,
      ),
    );
  };

  const interpolateRows = () => {
    const next =
      cloneEcuMap(
        map,
      );

    for (
      let row =
        bounds.rowStart;
      row <=
      bounds.rowEnd;
      row++
    ) {
      const start =
        next.values[row][
          bounds.columnStart
        ];

      const end =
        next.values[row][
          bounds.columnEnd
        ];

      const span =
        bounds.columnEnd -
        bounds.columnStart;

      if (
        span <= 0
      ) {
        continue;
      }

      for (
        let column =
          bounds.columnStart;
        column <=
        bounds.columnEnd;
        column++
      ) {
        const ratio =
          (
            column -
            bounds.columnStart
          ) /
          span;

        next.values[row][column] =
          start +
          (
            end -
            start
          ) *
          ratio;
      }
    }

    commit(
      next,
    );
  };

  const interpolateColumns = () => {
    const next =
      cloneEcuMap(
        map,
      );

    for (
      let column =
        bounds.columnStart;
      column <=
      bounds.columnEnd;
      column++
    ) {
      const start =
        next.values[
          bounds.rowStart
        ][column];

      const end =
        next.values[
          bounds.rowEnd
        ][column];

      const span =
        bounds.rowEnd -
        bounds.rowStart;

      if (
        span <= 0
      ) {
        continue;
      }

      for (
        let row =
          bounds.rowStart;
        row <=
        bounds.rowEnd;
        row++
      ) {
        const ratio =
          (
            row -
            bounds.rowStart
          ) /
          span;

        next.values[row][column] =
          start +
          (
            end -
            start
          ) *
          ratio;
      }
    }

    commit(
      next,
    );
  };

  const restoreOriginalTable = () => {
    commit(
      cloneEcuMap(
        baselineRef.current,
      ),
    );
  };

  const handleEditorKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const target =
      event.target as HTMLElement;

    const editingInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT";

    if (editingInput) {
      if (
        event.key === "Escape" ||
        event.key === "Enter"
      ) {
        target.blur();
        editorRef.current?.focus();
        event.preventDefault();
      }

      return;
    }

    const ctrl =
      event.ctrlKey ||
      event.metaKey;

    if (ctrl && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selectAllCells();
      return;
    }

    if (ctrl && event.key.toLowerCase() === "c") {
      event.preventDefault();
      copySelection();
      return;
    }

    if (ctrl && event.key.toLowerCase() === "v") {
      event.preventDefault();
      pasteSelection();
      return;
    }

    if (ctrl && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    if (ctrl && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        moveSelection(-1, 0, event.shiftKey);
        break;

      case "ArrowDown":
        event.preventDefault();
        moveSelection(1, 0, event.shiftKey);
        break;

      case "ArrowLeft":
        event.preventDefault();
        moveSelection(0, -1, event.shiftKey);
        break;

      case "ArrowRight":
        event.preventDefault();
        moveSelection(0, 1, event.shiftKey);
        break;

      case "+":
      case "=":
        event.preventDefault();
        applyAdd(
          event.shiftKey
            ? selectionStep * 10
            : selectionStep,
        );
        break;

      case "-":
      case "_":
        event.preventDefault();
        applyAdd(
          event.shiftKey
            ? -selectionStep * 10
            : -selectionStep,
        );
        break;

      case "PageUp":
        event.preventDefault();
        applyPercent(
          event.shiftKey
            ? 5
            : 1,
        );
        break;

      case "PageDown":
        event.preventDefault();
        applyPercent(
          event.shiftKey
            ? -5
            : -1,
        );
        break;

      case "*":
        event.preventDefault();
        multiplySelection(
          event.shiftKey
            ? 1.1
            : 1.01,
        );
        break;

      case "/":
        event.preventDefault();
        divideSelection(
          event.shiftKey
            ? 1.1
            : 1.01,
        );
        break;

      case "f":
      case "F":
        if (!ctrl) {
          event.preventDefault();
          fillSelectionFromAnchor();
        }
        break;

      case "Delete":
      case "Backspace":
        event.preventDefault();
        resetSelection();
        break;

      case "i":
      case "I":
        event.preventDefault();
        commit(
          interpolateSelection(
            map,
            selection,
          ),
        );
        break;

      case "s":
      case "S":
        if (!ctrl) {
          event.preventDefault();
          commit(
            smoothSelection(
              map,
              selection,
            ),
          );
        }
        break;
    }
  };

  const changeSingleCell = (
    row: number,
    column: number,
    value: number,
  ) => {
    const next =
      cloneEcuMap(
        map,
      );

    next.values[row][column] =
      Math.max(
        next.minimum,
        Math.min(
          next.maximum,
          value,
        ),
      );

    commit(
      next,
    );
  };

  const applyAdd = (
    amount: number,
  ) => {
    commit(
      applyToSelection(
        map,
        selection,
        (value) =>
          value +
          amount,
      ),
    );
  };

  const applyPercent = (
    percent: number,
  ) => {
    commit(
      applyToSelection(
        map,
        selection,
        (value) =>
          value *
          (
            1 +
            percent /
              100
          ),
      ),
    );
  };

  const copySelection =
    () => {
      const values:
        number[][] = [];

      for (
        let row =
          bounds.rowStart;
        row <= bounds.rowEnd;
        row++
      ) {
        const targetRow:
          number[] = [];

        for (
          let column =
            bounds.columnStart;
          column <=
            bounds.columnEnd;
          column++
        ) {
          targetRow.push(
            map.values[row]?.[
              column
            ] ?? 0,
          );
        }

        values.push(
          targetRow,
        );
      }

      clipboardRef.current = {
        width:
          bounds.columnEnd -
          bounds.columnStart +
          1,

        height:
          bounds.rowEnd -
          bounds.rowStart +
          1,

        values,
      };
    };

  const pasteSelection =
    () => {
      const clipboard =
        clipboardRef.current;

      if (
        !clipboard
      ) {
        return;
      }

      const next =
        cloneEcuMap(
          map,
        );

      for (
        let row = 0;
        row <
        clipboard.height;
        row++
      ) {
        for (
          let column = 0;
          column <
          clipboard.width;
          column++
        ) {
          const targetRow =
            bounds.rowStart +
            row;

          const targetColumn =
            bounds.columnStart +
            column;

          if (
            !next.values[
              targetRow
            ] ||
            typeof next.values[
              targetRow
            ][
              targetColumn
            ] !==
              "number"
          ) {
            continue;
          }

          next.values[
            targetRow
          ][
            targetColumn
          ] =
            Math.max(
              next.minimum,
              Math.min(
                next.maximum,
                clipboard.values[
                  row
                ][
                  column
                ],
              ),
            );
        }
      }

      commit(
        next,
      );
    };

  const undo =
    () => {
      const previous =
        undoStack[
          undoStack.length -
            1
        ];

      if (
        !previous
      ) {
        return;
      }

      setUndoStack(
        (
          current,
        ) =>
          current.slice(
            0,
            -1,
          ),
      );

      setRedoStack(
        (current) => [
          ...current,
          cloneEcuMap(
            map,
          ),
        ],
      );

      onChange(
        cloneEcuMap(
          previous,
        ),
      );
    };

  const redo =
    () => {
      const next =
        redoStack[
          redoStack.length -
            1
        ];

      if (
        !next
      ) {
        return;
      }

      setRedoStack(
        (
          current,
        ) =>
          current.slice(
            0,
            -1,
          ),
      );

      setUndoStack(
        (current) => [
          ...current,
          cloneEcuMap(
            map,
          ),
        ],
      );

      onChange(
        cloneEcuMap(
          next,
        ),
      );
    };

  const resetSelection =
    () => {
      const next =
        cloneEcuMap(
          map,
        );

      for (
        let row =
          bounds.rowStart;
        row <= bounds.rowEnd;
        row++
      ) {
        for (
          let column =
            bounds.columnStart;
          column <=
            bounds.columnEnd;
          column++
        ) {
          const original =
            baselineRef.current
              .values[
                row
              ]?.[
                column
              ];

          if (
            typeof original ===
            "number"
          ) {
            next.values[
              row
            ][
              column
            ] =
              original;
          }
        }
      }

      commit(
        next,
      );
    };

  const cellHeat = (
    value: number,
  ) => {
    const range =
      Math.max(
        0.000001,
        map.maximum -
          map.minimum,
      );

    return Math.max(
      0,
      Math.min(
        1,
        (
          value -
          map.minimum
        ) /
          range,
      ),
    );
  };

  const liveCell =
    livePoint
      ? {
          row:
            nearestAxisIndex(
              map.yAxis.values,
              livePoint.rpm,
            ),

          column:
            nearestAxisIndex(
              map.xAxis.values,
              livePoint.loadPercent,
            ),
        }
      : null;

  const traceCell =
    tracePoint
      ? {
          row:
            nearestAxisIndex(
              map.yAxis.values,
              tracePoint.rpm,
            ),

          column:
            nearestAxisIndex(
              map.xAxis.values,
              tracePoint.loadPercent,
            ),
        }
      : null;

  const interpolationCells =
    useMemo(
      () => {
        if (
          !livePoint
        ) {
          return new Set<string>();
        }

        const rows =
          interpolationIndexes(
            map.yAxis.values,
            livePoint.rpm,
          );

        const columns =
          interpolationIndexes(
            map.xAxis.values,
            livePoint.loadPercent,
          );

        return new Set(
          rows.flatMap(
            (row) =>
              columns.map(
                (column) =>
                  `${row}:${column}`,
              ),
          ),
        );
      },
      [
        livePoint,
        map.xAxis.values,
        map.yAxis.values,
      ],
    );

  const logOverlay =
    useMemo(
      () => {
        const result =
          new Map<
            string,
            {
              hits: number;
              afrErrorTotal: number;
            }
          >();

        if (
          map.kind !== "fuel"
        ) {
          return result;
        }

        logSamples.forEach(
          (sample) => {
            const row =
              nearestAxisIndex(
                map.yAxis.values,
                sample.rpm,
              );

            const column =
              nearestAxisIndex(
                map.xAxis.values,
                sample.engineLoad,
              );

            const key =
              `${row}:${column}`;

            const current =
              result.get(
                key,
              ) ?? {
                hits: 0,
                afrErrorTotal: 0,
              };

            current.hits += 1;

            if (
              sample.targetAfr !==
              undefined
            ) {
              current.afrErrorTotal +=
                sample.afr -
                sample.targetAfr;
            }

            result.set(
              key,
              current,
            );
          },
        );

        return result;
      },
      [
        logSamples,
        map.kind,
        map.xAxis.values,
        map.yAxis.values,
      ],
    );

  const average =
    useMemo(
      () =>
        mapAverage(
          map,
        ),
      [
        map,
      ],
    );

  return (
    <div
      ref={editorRef}
      className="tune-editor"
      tabIndex={0}
      onKeyDown={handleEditorKeyDown}
      onMouseUp={stopDragSelection}
      onMouseLeave={stopDragSelection}
    >
      <div className="tune-editor-titlebar">
        <div>
          <span className="tune-path">
            ECU
            {" / "}
            {map.kind.toUpperCase()}
            {" / "}
            {mapDisplayName(
              map,
            )}
          </span>

          <h3>
            {mapDisplayName(
              map,
            )}
          </h3>
        </div>

        <div className="tune-map-state">
          {changed ? (
            <>
              <CircleDot
                size={14}
              />

              MODIFIED
            </>
          ) : (
            <>
              <CheckCircle2
                size={14}
              />

              CALIBRATION SYNCED
            </>
          )}
        </div>
      </div>

      <div className="ecuflash-editor-menu">
        <div className="ecuflash-menu-root">
          <button
            type="button"
            className={
              openEditorMenu === "edit"
                ? "active"
                : ""
            }
            onClick={() =>
              setOpenEditorMenu(
                openEditorMenu === "edit"
                  ? null
                  : "edit",
              )
            }
          >
            Edit
          </button>

          {openEditorMenu === "edit" && (
            <div className="ecuflash-menu-dropdown">
              <button
                type="button"
                disabled={
                  undoStack.length === 0
                }
                onClick={() => {
                  undo();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Undo</span>
                <kbd>Ctrl+Z</kbd>
              </button>

              <button
                type="button"
                disabled={
                  redoStack.length === 0
                }
                onClick={() => {
                  redo();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Redo</span>
                <kbd>Ctrl+Y</kbd>
              </button>

              <div className="ecuflash-menu-separator" />

              <button
                type="button"
                onClick={() => {
                  copySelection();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Copy</span>
                <kbd>Ctrl+C</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  pasteSelection();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Paste</span>
                <kbd>Ctrl+V</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  selectAllCells();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Select All</span>
                <kbd>Ctrl+A</kbd>
              </button>

              <div className="ecuflash-menu-separator" />

              <button
                type="button"
                onClick={() => {
                  resetSelection();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Reset Selected Cells</span>
                <kbd>Del</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  restoreOriginalTable();
                  setOpenEditorMenu(null);
                }}
              >
                <span>Restore Original Table</span>
              </button>
            </div>
          )}
        </div>

        <div className="ecuflash-menu-root">
          <button
            type="button"
            className={
              openEditorMenu === "view"
                ? "active"
                : ""
            }
            onClick={() =>
              setOpenEditorMenu(
                openEditorMenu === "view"
                  ? null
                  : "view",
              )
            }
          >
            View
          </button>

          {openEditorMenu === "view" && (
            <div className="ecuflash-menu-dropdown">
              <button
                type="button"
                className={
                  viewMode === "table"
                    ? "checked"
                    : ""
                }
                onClick={() => {
                  setViewMode("table");
                  setOpenEditorMenu(null);
                }}
              >
                <span>Table View</span>
                <span className="menu-check">
                  {viewMode === "table" ? "✓" : ""}
                </span>
              </button>

              <button
                type="button"
                className={
                  viewMode === "surface"
                    ? "checked"
                    : ""
                }
                onClick={() => {
                  setViewMode("surface");
                  setOpenEditorMenu(null);
                }}
              >
                <span>3D Surface View</span>
                <span className="menu-check">
                  {viewMode === "surface" ? "✓" : ""}
                </span>
              </button>

              <div className="ecuflash-menu-separator" />

              <button
                type="button"
                className={
                  compare
                    ? "checked"
                    : ""
                }
                onClick={() => {
                  setCompare(
                    (current) => !current,
                  );
                }}
              >
                <span>Compare With Original</span>
                <span className="menu-check">
                  {compare ? "✓" : ""}
                </span>
              </button>

              <button
                type="button"
                className={
                  changedOnly
                    ? "checked"
                    : ""
                }
                disabled={
                  !compare
                }
                onClick={() => {
                  setChangedOnly(
                    (current) => !current,
                  );
                }}
              >
                <span>Changed Cells Only</span>
                <span className="menu-check">
                  {changedOnly ? "✓" : ""}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="ecuflash-menu-root">
          <button
            type="button"
            className={
              openEditorMenu === "help"
                ? "active"
                : ""
            }
            onClick={() =>
              setOpenEditorMenu(
                openEditorMenu === "help"
                  ? null
                  : "help",
              )
            }
          >
            Help
          </button>

          {openEditorMenu === "help" && (
            <div className="ecuflash-menu-dropdown help-menu">
              <div className="ecuflash-help-title">
                NEXUS TABLE SHORTCUTS
              </div>

              <div className="ecuflash-help-row">
                <span>Move cell</span>
                <kbd>Arrow Keys</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Extend selection</span>
                <kbd>Shift + Arrows</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Copy / Paste</span>
                <kbd>Ctrl+C / Ctrl+V</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Undo / Redo</span>
                <kbd>Ctrl+Z / Ctrl+Y</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Adjust value</span>
                <kbd>+ / -</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Percent adjust</span>
                <kbd>PgUp / PgDn</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Interpolate</span>
                <kbd>I</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Smooth</span>
                <kbd>S</kbd>
              </div>

              <div className="ecuflash-help-row">
                <span>Reset selected</span>
                <kbd>Delete</kbd>
              </div>
            </div>
          )}
        </div>

        <span className="ecuflash-editor-menu-spacer" />

        <span>
          {map.yAxis.values.length}
          ×
          {map.xAxis.values.length}
          {" "}
          table
        </span>
      </div>

      <div className="advanced-calibration-visible-banner">
        ADVANCED CALIBRATION TOOLS · V6.3
      </div>

      <AdvancedCalibrationTools
        selectionCount={
          selectionCount
        }
        minimum={
          selectionMin
        }
        maximum={
          selectionMax
        }
        average={
          selectionAverage
        }
        undoDepth={
          undoStack.length
        }
        redoDepth={
          redoStack.length
        }
        onSetExact={
          setSelectionExact
        }
        onClamp={
          clampSelection
        }
        onRound={
          roundSelection
        }
        onInterpolateRows={
          interpolateRows
        }
        onInterpolateColumns={
          interpolateColumns
        }
        onRestoreBaseline={
          restoreOriginalTable
        }
      />

      <MapToolbar
        canUndo={
          undoStack.length >
          0
        }
        canRedo={
          redoStack.length >
          0
        }
        compare={
          compare
        }
        viewMode={
          viewMode
        }
        onUndo={
          undo
        }
        onRedo={
          redo
        }
        onCopy={
          copySelection
        }
        onPaste={
          pasteSelection
        }
        onAdd={
          applyAdd
        }
        onPercent={
          applyPercent
        }
        onSmooth={() =>
          commit(
            smoothSelection(
              map,
              selection,
            ),
          )
        }
        onInterpolate={() =>
          commit(
            interpolateSelection(
              map,
              selection,
            ),
          )
        }
        onResetSelection={
          resetSelection
        }
        onToggleCompare={() =>
          setCompare(
            (current) =>
              !current,
          )
        }
        onViewMode={
          setViewMode
        }
      />



      <div className="tune-map-meta">
        <div>
          <span>
            X AXIS
          </span>

          <strong>
            LOAD %
          </strong>
        </div>

        <div>
          <span>
            Y AXIS
          </span>

          <strong>
            RPM
          </strong>
        </div>

        <div>
          <span>
            VALUE
          </span>

          <strong>
            {mapUnit(
              map,
            )}
          </strong>
        </div>

        <div>
          <span>
            RANGE
          </span>

          <strong>
            {formatMapValue(
              map,
              map.minimum,
            )}
            {" – "}
            {formatMapValue(
              map,
              map.maximum,
            )}
          </strong>
        </div>

        <div>
          <span>
            TABLE AVG
          </span>

          <strong>
            {formatMapValue(
              map,
              average,
            )}
          </strong>
        </div>

        <div>
          <span>
            SELECTED
          </span>

          <strong>
            {selectionCount}
            {" "}
            CELL
            {selectionCount ===
            1
              ? ""
              : "S"}
          </strong>
        </div>
      </div>

      <div className="tune-trace-strip">
        <div>
          <span>
            LIVE TRACE
          </span>

          <strong>
            {livePoint
              ? `${Math.round(
                  livePoint.rpm,
                ).toLocaleString()} RPM / ${livePoint.loadPercent.toFixed(
                  1,
                )}% LOAD`
              : "ENGINE OFF"}
          </strong>
        </div>

        <div>
          <span>
            ACTIVE CELL
          </span>

          <strong>
            {liveCell
              ? `R${liveCell.row + 1} C${liveCell.column + 1}`
              : "—"}
          </strong>
        </div>

        <div>
          <span>
            LOG TRACE
          </span>

          <strong>
            {tracePoint
              ? `${Math.round(
                  tracePoint.rpm,
                ).toLocaleString()} RPM / ${tracePoint.loadPercent.toFixed(
                  1,
                )}% LOAD`
              : "—"}
          </strong>
        </div>

        <div>
          <span>
            FUEL OVERLAY
          </span>

          <strong>
            {map.kind ===
            "fuel"
              ? `${logOverlay.size} LOGGED CELLS`
              : "FUEL MAP ONLY"}
          </strong>
        </div>
      </div>

      <div className="ecuflash-command-bar">
        <label>
          <span>VALUE</span>
          <input
            value={quickValue}
            placeholder="Set selected…"
            onChange={(event) =>
              setQuickValue(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyQuickValue();
              }
            }}
          />
          <button
            type="button"
            onClick={
              applyQuickValue
            }
          >
            SET
          </button>
        </label>

        <label>
          <span>STEP</span>
          <input
            type="number"
            step="0.01"
            value={customStep}
            onChange={(event) =>
              setCustomStep(
                Math.abs(
                  Number(
                    event.target.value,
                  ),
                ) || 0.01,
              )
            }
          />
        </label>

        <div className="ecuflash-command-group">
          <button
            type="button"
            onClick={() =>
              applyAdd(
                customStep,
              )
            }
          >
            + STEP
          </button>

          <button
            type="button"
            onClick={() =>
              applyAdd(
                -customStep,
              )
            }
          >
            − STEP
          </button>
        </div>

        <div className="ecuflash-command-group">
          <button
            type="button"
            onClick={() =>
              applyPercent(
                1,
              )
            }
          >
            +1%
          </button>

          <button
            type="button"
            onClick={() =>
              applyPercent(
                -1,
              )
            }
          >
            −1%
          </button>

          <button
            type="button"
            onClick={() =>
              multiplySelection(
                1.1,
              )
            }
          >
            ×1.10
          </button>

          <button
            type="button"
            onClick={() =>
              divideSelection(
                1.1,
              )
            }
          >
            ÷1.10
          </button>
        </div>

        <div className="ecuflash-command-group">
          <button
            type="button"
            onClick={
              fillSelectionFromAnchor
            }
          >
            FILL SELECTION
          </button>

          <button
            type="button"
            className={
              changedOnly
                ? "active"
                : ""
            }
            onClick={() =>
              setChangedOnly(
                (current) =>
                  !current,
              )
            }
          >
            CHANGED ONLY
          </button>
        </div>
      </div>

      <div className="tune-shortcut-strip">
        <span><kbd>DRAG</kbd> SELECT RANGE</span>
        <span><kbd>SHIFT + CLICK</kbd> EXTEND</span>
        <span><kbd>ARROWS</kbd> MOVE</span>
        <span><kbd>SHIFT + ARROWS</kbd> EXTEND</span>
        <span><kbd>CTRL+A</kbd> SELECT ALL</span>
        <span><kbd>CTRL+C / V</kbd> COPY / PASTE</span>
        <span><kbd>CTRL+Z / Y</kbd> UNDO / REDO</span>
        <span><kbd>+ / -</kbd> STEP VALUE</span>
        <span><kbd>PGUP / PGDN</kbd> ±1%</span>
        <span><kbd>* / /</kbd> × / ÷</span>
        <span><kbd>F</kbd> FILL SELECTION</span>
        <span><kbd>I</kbd> INTERPOLATE</span>
        <span><kbd>S</kbd> SMOOTH</span>
        <span><kbd>DEL</kbd> RESET</span>
      </div>

      {viewMode ===
      "table" ? (
        <div className="tune-table-shell">
          <table className="tune-table">
            <thead>
              <tr>
                <th className="tune-axis-corner">
                  RPM / LOAD
                </th>

                {map.xAxis.values.map(
                  (
                    load,
                    column,
                  ) => (
                    <th
                      key={`${load}-${column}`}
                      className="ecuflash-column-axis"
                      style={{
                        "--axis-heat":
                          map.xAxis.values.length > 1
                            ? column /
                              (map.xAxis.values.length - 1)
                            : 0,
                      } as React.CSSProperties}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectWholeColumn(
                          column,
                        );
                      }}
                      onDoubleClick={() =>
                        setEditingXAxis(
                          column,
                        )
                      }
                    >
                      {editingXAxis ===
                      column ? (
                        <input
                          className="ecuflash-axis-input"
                          autoFocus
                          defaultValue={
                            load
                          }
                          onBlur={(event) => {
                            updateXAxisValue(
                              column,
                              Number(
                                event.target.value,
                              ),
                            );
                            setEditingXAxis(
                              null,
                            );
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              event.currentTarget.blur();
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              setEditingXAxis(
                                null,
                              );
                            }
                          }}
                        />
                      ) : (
                        <>
                          {load}
                          %
                        </>
                      )}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {map.yAxis.values.map(
                (
                  rpm,
                  row,
                ) => (
                  <tr
                    key={`${rpm}-${row}`}
                  >
                    <th
                      className="tune-row-axis"
                      style={{
                        "--axis-heat":
                          map.yAxis.values.length > 1
                            ? row /
                              (map.yAxis.values.length - 1)
                            : 0,
                      } as React.CSSProperties}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectWholeRow(
                          row,
                        );
                      }}
                      onDoubleClick={() =>
                        setEditingYAxis(
                          row,
                        )
                      }
                    >
                      {editingYAxis ===
                      row ? (
                        <input
                          className="ecuflash-axis-input"
                          autoFocus
                          defaultValue={
                            rpm
                          }
                          onBlur={(event) => {
                            updateYAxisValue(
                              row,
                              Number(
                                event.target.value,
                              ),
                            );
                            setEditingYAxis(
                              null,
                            );
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              event.currentTarget.blur();
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              setEditingYAxis(
                                null,
                              );
                            }
                          }}
                        />
                      ) : (
                        rpm.toLocaleString()
                      )}
                    </th>

                    {map.values[
                      row
                    ]?.map(
                      (
                        value,
                        column,
                      ) => {
                        const selected =
                          cellIsSelected(
                            row,
                            column,
                            selection,
                          );

                        const original =
                          baselineRef.current
                            .values[
                              row
                            ]?.[
                              column
                            ] ??
                          value;

                        const difference =
                          value -
                          original;

                        return (
                          <td
                            key={`${row}-${column}`}
                            className={`tune-cell ${
                              selected
                                ? "selected"
                                : ""
                            } ${
                              selection.end.row === row &&
                              selection.end.column === column
                                ? "active-cell"
                                : ""
                            } ${
                              changedFromBaseline(
                                row,
                                column,
                              )
                                ? "changed-from-baseline"
                                : ""
                            } ${
                              changedOnly &&
                              compare &&
                              !changedFromBaseline(
                                row,
                                column,
                              )
                                ? "unchanged-hidden"
                                : ""
                            } ${
                              Math.abs(
                                difference,
                              ) >
                              0.000001
                                ? "modified"
                                : ""
                            } ${
                              liveCell?.row === row &&
                              liveCell?.column === column
                                ? "live-cell"
                                : ""
                            } ${
                              traceCell?.row === row &&
                              traceCell?.column === column
                                ? "trace-cell"
                                : ""
                            } ${
                              interpolationCells.has(
                                `${row}:${column}`,
                              )
                                ? "interpolation-cell"
                                : ""
                            }`}
                            style={{
                              "--heat":
                                cellHeat(
                                  value,
                                ),
                            } as React.CSSProperties}
                            onMouseDown={(
                              event,
                            ) => {
                              if (event.button !== 0) {
                                return;
                              }

                              event.preventDefault();

                              beginDragSelection(
                                row,
                                column,
                                event.shiftKey,
                              );
                            }}
                            onMouseEnter={() =>
                              extendDragSelection(
                                row,
                                column,
                              )
                            }
                          >
                            <input
                              aria-label={`RPM ${rpm}, load ${map.xAxis.values[column]}`}
                              type="number"
                              step={
                                map.kind ===
                                "boost"
                                  ? 0.05
                                  : 0.1
                              }
                              value={
                                compare
                                  ? original
                                  : Number(
                                      formatMapValue(
                                        map,
                                        value,
                                      ),
                                    )
                              }
                              readOnly={
                                compare
                              }
                              onMouseDown={(event) =>
                                event.preventDefault()
                              }
                              onDoubleClick={(event) => {
                                event.currentTarget.focus();
                                event.currentTarget.select();
                              }}
                              onFocus={() =>
                                clickCell(
                                  row,
                                  column,
                                  false,
                                )
                              }
                              onChange={(
                                event,
                              ) =>
                                changeSingleCell(
                                  row,
                                  column,
                                  Number(
                                    event.target.value,
                                  ),
                                )
                              }
                            />

                            {!compare &&
                              Math.abs(
                                difference,
                              ) >
                                0.000001 && (
                                <small className="tune-delta">
                                  {difference >
                                  0
                                    ? "+"
                                    : ""}
                                  {difference.toFixed(
                                    2,
                                  )}
                                </small>
                              )}

                            {map.kind ===
                              "fuel" &&
                              logOverlay.has(
                                `${row}:${column}`,
                              ) && (
                                <div className="tune-log-overlay">
                                  <span>
                                    H{
                                      logOverlay.get(
                                        `${row}:${column}`,
                                      )?.hits ?? 0
                                    }
                                  </span>

                                  <span>
                                    Δ
                                    {(
                                      (
                                        logOverlay.get(
                                          `${row}:${column}`,
                                        )?.afrErrorTotal ?? 0
                                      ) /
                                      Math.max(
                                        1,
                                        logOverlay.get(
                                          `${row}:${column}`,
                                        )?.hits ?? 1,
                                      )
                                    ).toFixed(
                                      2,
                                    )}
                                  </span>
                                </div>
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
      ) : (
        <div className="tune-surface">
          <div className="tune-surface-grid">
            {map.values.flatMap(
              (
                rowValues,
                row,
              ) =>
                rowValues.map(
                  (
                    value,
                    column,
                  ) => (
                    <button
                      type="button"
                      key={`${row}-${column}`}
                      className={`tune-surface-bar ${
                        cellIsSelected(
                          row,
                          column,
                          selection,
                        )
                          ? "selected"
                          : ""
                      }`}
                      style={{
                        "--height": `${Math.max(
                          8,
                          cellHeat(
                            value,
                          ) *
                            100,
                        )}%`,
                        "--heat":
                          cellHeat(
                            value,
                          ),
                      } as React.CSSProperties}
                      title={`RPM ${map.yAxis.values[row]} / Load ${map.xAxis.values[column]}% / ${formatMapValue(
                        map,
                        value,
                      )} ${mapUnit(
                        map,
                      )}`}
                      onClick={(
                        event,
                      ) =>
                        clickCell(
                          row,
                          column,
                          event.shiftKey,
                        )
                      }
                    >
                      <span />
                    </button>
                  ),
                ),
            )}
          </div>

          <div className="tune-surface-caption">
            3D CALIBRATION SURFACE
          </div>
        </div>
      )}

      <div className="tune-statusbar">
        <div>
          <span>
            SELECTED CELL
          </span>

          <strong>
            RPM:
            {" "}
            {selectedRpm.toLocaleString()}
            {" | "}
            LOAD:
            {" "}
            {selectedLoad}%
          </strong>
        </div>

        <div>
          <span>
            VALUE
          </span>

          <strong>
            {formatMapValue(
              map,
              selectedValue,
            )}
            {" "}
            {mapUnit(
              map,
            )}
          </strong>
        </div>

        <div>
          <span>
            SELECTION
          </span>

          <strong>
            {selectionCount} CELL
            {selectionCount === 1
              ? ""
              : "S"}
            {" · "}
            R
            {bounds.rowStart + 1}
            :
            {bounds.rowEnd + 1}
            {" "}
            C
            {bounds.columnStart + 1}
            :
            {bounds.columnEnd + 1}
          </strong>
        </div>

        <div>
          <span>
            MIN / MAX
          </span>

          <strong>
            {formatMapValue(
              map,
              selectionMin,
            )}
            {" / "}
            {formatMapValue(
              map,
              selectionMax,
            )}
            {" "}
            {mapUnit(
              map,
            )}
          </strong>
        </div>

        <div>
          <span>
            AVERAGE
          </span>

          <strong>
            {formatMapValue(
              map,
              selectionAverage,
            )}
            {" "}
            {mapUnit(
              map,
            )}
          </strong>
        </div>

        <div>
          <span>
            EDIT MODE
          </span>

          <strong>
            {compare
              ? "ORIGINAL / COMPARE"
              : "LIVE CALIBRATION"}
          </strong>
        </div>
      </div>
    </div>
  );
}
