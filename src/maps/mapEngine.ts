import type {
  EcuMap,
  MapPoint,
  MapValidationResult,
} from "./mapTypes";

export function createMap(
  id: string,
  name: string,
  kind: EcuMap["kind"],
  xValues: number[],
  yValues: number[],
  values: number[][],
  unit: string,
  minimum: number,
  maximum: number,
): EcuMap {
  return {
    id,
    name,
    kind,

    xAxis: {
      values: xValues,
      label: "Engine Load",
      unit: "%",
    },

    yAxis: {
      values: yValues,
      label: "RPM",
      unit: "rpm",
    },

    values,
    unit,

    minimum,
    maximum,
  };
}

export function getMapValue(
  map: EcuMap,
  x: number,
  y: number,
): number {
  const xAxis = map.xAxis.values;
  const yAxis = map.yAxis.values;

  if (
    xAxis.length === 0 ||
    yAxis.length === 0
  ) {
    return 0;
  }

  const clampedX = clamp(
    x,
    xAxis[0],
    xAxis[xAxis.length - 1],
  );

  const clampedY = clamp(
    y,
    yAxis[0],
    yAxis[yAxis.length - 1],
  );

  const xIndex = findLowerIndex(
    xAxis,
    clampedX,
  );

  const yIndex = findLowerIndex(
    yAxis,
    clampedY,
  );

  const x1 = xAxis[xIndex];
  const x2 =
    xAxis[
      Math.min(
        xIndex + 1,
        xAxis.length - 1,
      )
    ];

  const y1 = yAxis[yIndex];
  const y2 =
    yAxis[
      Math.min(
        yIndex + 1,
        yAxis.length - 1,
      )
    ];

  const q11 =
    map.values[yIndex][xIndex];

  const q21 =
    map.values[yIndex][
      Math.min(
        xIndex + 1,
        xAxis.length - 1,
      )
    ];

  const q12 =
    map.values[
      Math.min(
        yIndex + 1,
        yAxis.length - 1,
      )
    ][xIndex];

  const q22 =
    map.values[
      Math.min(
        yIndex + 1,
        yAxis.length - 1,
      )
    ][
      Math.min(
        xIndex + 1,
        xAxis.length - 1,
      )
    ];

  const xFraction =
    x2 === x1
      ? 0
      : (clampedX - x1) /
        (x2 - x1);

  const yFraction =
    y2 === y1
      ? 0
      : (clampedY - y1) /
        (y2 - y1);

  const top =
    q11 +
    (q21 - q11) *
      xFraction;

  const bottom =
    q12 +
    (q22 - q12) *
      xFraction;

  return (
    top +
    (bottom - top) *
      yFraction
  );
}

export function setMapValue(
  map: EcuMap,
  row: number,
  column: number,
  value: number,
): EcuMap {
  const values =
    map.values.map(
      (currentRow) =>
        [...currentRow],
    );

  if (
    row < 0 ||
    row >= values.length ||
    column < 0 ||
    column >= values[row].length
  ) {
    return map;
  }

  values[row][column] =
    clamp(
      value,
      map.minimum,
      map.maximum,
    );

  return {
    ...map,
    values,
  };
}

export function validateMap(
  map: EcuMap,
): MapValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (map.xAxis.values.length === 0) {
    errors.push(
      "X axis is empty.",
    );
  }

  if (map.yAxis.values.length === 0) {
    errors.push(
      "Y axis is empty.",
    );
  }

  if (
    map.values.length !==
    map.yAxis.values.length
  ) {
    errors.push(
      "Map row count does not match the Y axis.",
    );
  }

  for (
    let row = 0;
    row < map.values.length;
    row++
  ) {
    if (
      map.values[row].length !==
      map.xAxis.values.length
    ) {
      errors.push(
        `Row ${row} does not match the X axis.`,
      );
    }
  }

  for (
    const row of map.values
  ) {
    for (
      const value of row
    ) {
      if (!Number.isFinite(value)) {
        errors.push(
          "Map contains a non-numeric value.",
        );
      }

      if (
        value < map.minimum ||
        value > map.maximum
      ) {
        warnings.push(
          "One or more values are outside the configured range.",
        );

        break;
      }
    }
  }

  if (
    !isAscending(
      map.xAxis.values,
    )
  ) {
    errors.push(
      "X axis must be ascending.",
    );
  }

  if (
    !isAscending(
      map.yAxis.values,
    )
  ) {
    errors.push(
      "Y axis must be ascending.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [
      ...new Set(warnings),
    ],
  };
}

export function flattenMap(
  map: EcuMap,
): MapPoint[] {
  const points: MapPoint[] = [];

  for (
    let row = 0;
    row < map.yAxis.values.length;
    row++
  ) {
    for (
      let column = 0;
      column < map.xAxis.values.length;
      column++
    ) {
      points.push({
        x: map.xAxis.values[column],
        y: map.yAxis.values[row],
        value:
          map.values[row][column],
      });
    }
  }

  return points;
}

function findLowerIndex(
  values: number[],
  target: number,
): number {
  if (target <= values[0]) {
    return 0;
  }

  for (
    let index = 0;
    index <
    values.length - 1;
    index++
  ) {
    if (
      target >= values[index] &&
      target <= values[index + 1]
    ) {
      return index;
    }
  }

  return values.length - 1;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function isAscending(
  values: number[],
): boolean {
  for (
    let index = 1;
    index < values.length;
    index++
  ) {
    if (
      values[index] <=
      values[index - 1]
    ) {
      return false;
    }
  }

  return true;
}