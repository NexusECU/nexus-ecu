import type {
  EcuMap,
} from "./mapTypes";

export type MapCell = {
  row: number;

  column: number;
};

export type MapSelection = {
  start: MapCell;

  end: MapCell;
};

export function cloneEcuMap(
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

export function normaliseSelection(
  selection: MapSelection,
): {
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
} {
  return {
    rowStart:
      Math.min(
        selection.start.row,
        selection.end.row,
      ),

    rowEnd:
      Math.max(
        selection.start.row,
        selection.end.row,
      ),

    columnStart:
      Math.min(
        selection.start.column,
        selection.end.column,
      ),

    columnEnd:
      Math.max(
        selection.start.column,
        selection.end.column,
      ),
  };
}

export function cellIsSelected(
  row: number,
  column: number,
  selection: MapSelection,
): boolean {
  const bounds =
    normaliseSelection(
      selection,
    );

  return (
    row >= bounds.rowStart &&
    row <= bounds.rowEnd &&
    column >=
      bounds.columnStart &&
    column <=
      bounds.columnEnd
  );
}

export function clampMapValue(
  map: EcuMap,
  value: number,
): number {
  return Math.max(
    map.minimum,
    Math.min(
      map.maximum,
      value,
    ),
  );
}

export function applyToSelection(
  map: EcuMap,
  selection: MapSelection,
  operation: (
    value: number,
    row: number,
    column: number,
  ) => number,
): EcuMap {
  const next =
    cloneEcuMap(
      map,
    );

  const bounds =
    normaliseSelection(
      selection,
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
      const current =
        next.values[
          row
        ]?.[
          column
        ];

      if (
        typeof current !==
        "number"
      ) {
        continue;
      }

      next.values[row][column] =
        clampMapValue(
          next,
          operation(
            current,
            row,
            column,
          ),
        );
    }
  }

  return next;
}

export function smoothSelection(
  map: EcuMap,
  selection: MapSelection,
): EcuMap {
  const source =
    cloneEcuMap(
      map,
    );

  return applyToSelection(
    map,
    selection,
    (
      _value,
      row,
      column,
    ) => {
      const neighbours:
        number[] = [];

      for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
      ) {
        for (
          let columnOffset = -1;
          columnOffset <= 1;
          columnOffset++
        ) {
          const sample =
            source.values[
              row + rowOffset
            ]?.[
              column +
                columnOffset
            ];

          if (
            typeof sample ===
            "number"
          ) {
            neighbours.push(
              sample,
            );
          }
        }
      }

      if (
        neighbours.length ===
        0
      ) {
        return (
          source.values[
            row
          ]?.[
            column
          ] ?? 0
        );
      }

      return (
        neighbours.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ) /
        neighbours.length
      );
    },
  );
}

export function interpolateSelection(
  map: EcuMap,
  selection: MapSelection,
): EcuMap {
  const bounds =
    normaliseSelection(
      selection,
    );

  const next =
    cloneEcuMap(
      map,
    );

  const leftTop =
    map.values[
      bounds.rowStart
    ]?.[
      bounds.columnStart
    ] ?? 0;

  const rightTop =
    map.values[
      bounds.rowStart
    ]?.[
      bounds.columnEnd
    ] ??
    leftTop;

  const leftBottom =
    map.values[
      bounds.rowEnd
    ]?.[
      bounds.columnStart
    ] ??
    leftTop;

  const rightBottom =
    map.values[
      bounds.rowEnd
    ]?.[
      bounds.columnEnd
    ] ??
    rightTop;

  const rowRange =
    Math.max(
      1,
      bounds.rowEnd -
        bounds.rowStart,
    );

  const columnRange =
    Math.max(
      1,
      bounds.columnEnd -
        bounds.columnStart,
    );

  for (
    let row =
      bounds.rowStart;
    row <= bounds.rowEnd;
    row++
  ) {
    const rowFactor =
      (
        row -
        bounds.rowStart
      ) /
      rowRange;

    for (
      let column =
        bounds.columnStart;
      column <=
        bounds.columnEnd;
      column++
    ) {
      const columnFactor =
        (
          column -
          bounds.columnStart
        ) /
        columnRange;

      const top =
        leftTop +
        (
          rightTop -
          leftTop
        ) *
          columnFactor;

      const bottom =
        leftBottom +
        (
          rightBottom -
          leftBottom
        ) *
          columnFactor;

      next.values[row][column] =
        clampMapValue(
          next,
          top +
            (
              bottom -
              top
            ) *
              rowFactor,
        );
    }
  }

  return next;
}

export function mapAverage(
  map: EcuMap,
): number {
  const values =
    map.values.flat();

  if (
    values.length ===
    0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    values.length
  );
}

export function formatMapValue(
  map: EcuMap,
  value: number,
): string {
  if (
    map.kind ===
    "ignition"
  ) {
    return value.toFixed(
      1,
    );
  }

  if (
    map.kind ===
    "boost"
  ) {
    return value.toFixed(
      2,
    );
  }

  return value.toFixed(
    2,
  );
}

export function mapUnit(
  map: EcuMap,
): string {
  if (
    map.kind ===
    "fuel"
  ) {
    return "AFR";
  }

  if (
    map.kind ===
    "ignition"
  ) {
    return "°BTDC";
  }

  return "BAR";
}

export function mapDisplayName(
  map: EcuMap,
): string {
  if (
    map.kind ===
    "fuel"
  ) {
    return "Base Fuel / Lambda Target";
  }

  if (
    map.kind ===
    "ignition"
  ) {
    return "Base Ignition Timing";
  }

  return "Target Boost";
}
