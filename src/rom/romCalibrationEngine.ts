import type {
  CalibrationDefinition,
  CalibrationEndian,
  CalibrationScale,
} from "../maps/calibrationDefinitionTypes";

import type {
  EcuMap,
} from "../maps/mapTypes";

function parseAddress(
  address: string,
): number {
  const text =
    address.trim();

  const value =
    text.startsWith("0x") ||
    text.startsWith("0X")
      ? Number.parseInt(
          text.slice(2),
          16,
        )
      : Number.parseInt(
          text,
          10,
        );

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `Invalid ROM address: ${address}`,
    );
  }

  return value;
}

function byteWidth(
  dataType: string,
): number {
  switch (dataType) {
    case "boolean":
    case "uint8":
    case "int8":
      return 1;

    case "uint16":
    case "int16":
      return 2;

    case "uint32":
    case "int32":
    case "float32":
      return 4;

    default:
      throw new Error(
        `Unsupported ROM data type: ${dataType}`,
      );
  }
}

function littleEndian(
  endian: CalibrationEndian,
): boolean {
  return endian === "little";
}

function readRaw(
  view: DataView,
  address: number,
  dataType: string,
  endian: CalibrationEndian,
): number {
  const little =
    littleEndian(
      endian,
    );

  switch (dataType) {
    case "boolean":
    case "uint8":
      return view.getUint8(
        address,
      );

    case "int8":
      return view.getInt8(
        address,
      );

    case "uint16":
      return view.getUint16(
        address,
        little,
      );

    case "int16":
      return view.getInt16(
        address,
        little,
      );

    case "uint32":
      return view.getUint32(
        address,
        little,
      );

    case "int32":
      return view.getInt32(
        address,
        little,
      );

    case "float32":
      return view.getFloat32(
        address,
        little,
      );

    default:
      throw new Error(
        `Unsupported ROM data type: ${dataType}`,
      );
  }
}

function writeRaw(
  view: DataView,
  address: number,
  dataType: string,
  endian: CalibrationEndian,
  rawValue: number,
): void {
  const little =
    littleEndian(
      endian,
    );

  switch (dataType) {
    case "boolean":
    case "uint8":
      view.setUint8(
        address,
        Math.round(
          rawValue,
        ),
      );
      return;

    case "int8":
      view.setInt8(
        address,
        Math.round(
          rawValue,
        ),
      );
      return;

    case "uint16":
      view.setUint16(
        address,
        Math.round(
          rawValue,
        ),
        little,
      );
      return;

    case "int16":
      view.setInt16(
        address,
        Math.round(
          rawValue,
        ),
        little,
      );
      return;

    case "uint32":
      view.setUint32(
        address,
        Math.round(
          rawValue,
        ),
        little,
      );
      return;

    case "int32":
      view.setInt32(
        address,
        Math.round(
          rawValue,
        ),
        little,
      );
      return;

    case "float32":
      view.setFloat32(
        address,
        rawValue,
        little,
      );
      return;

    default:
      throw new Error(
        `Unsupported ROM data type: ${dataType}`,
      );
  }
}

function decodeScaled(
  raw: number,
  scale:
    CalibrationScale,
): number {
  return (
    raw *
      scale.multiplier +
    scale.offset
  );
}

function encodeScaled(
  engineering:
    number,
  scale:
    CalibrationScale,
): number {
  if (
    scale.multiplier ===
    0
  ) {
    throw new Error(
      "Calibration scale multiplier cannot be zero.",
    );
  }

  return (
    engineering -
      scale.offset
  ) /
    scale.multiplier;
}

function assertRange(
  bytes: Uint8Array,
  address: number,
  dataType: string,
): void {
  const width =
    byteWidth(
      dataType,
    );

  if (
    address < 0 ||
    address + width >
      bytes.length
  ) {
    throw new Error(
      `ROM address 0x${address.toString(16).toUpperCase()} is outside the loaded image.`,
    );
  }
}

function axisValues(
  bytes: Uint8Array,
  addressText: string,
  count: number,
  dataType: string,
  endian: CalibrationEndian,
  scale: CalibrationScale,
): number[] {
  const address =
    parseAddress(
      addressText,
    );

  const width =
    byteWidth(
      dataType,
    );

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );

  return Array.from(
    {
      length:
        count,
    },
    (
      _,
      index,
    ) => {
      const offset =
        address +
        index *
          width;

      assertRange(
        bytes,
        offset,
        dataType,
      );

      return decodeScaled(
        readRaw(
          view,
          offset,
          dataType,
          endian,
        ),
        scale,
      );
    },
  );
}

export function decodeTableFromRom(
  bytes: Uint8Array,
  definition:
    CalibrationDefinition,
): EcuMap {
  const layout =
    definition.binary;

  const sourceMap =
    definition.map;

  if (
    !layout ||
    !sourceMap
  ) {
    throw new Error(
      `${definition.name} does not contain a binary table definition.`,
    );
  }

  const rows =
    layout.rows ??
    sourceMap.values.length;

  const columns =
    layout.columns ??
    sourceMap.values[0]
      ?.length ??
    0;

  const width =
    byteWidth(
      layout.dataType,
    );

  const rowStride =
    layout.rowStrideBytes ??
    columns *
      width;

  const columnStride =
    layout.columnStrideBytes ??
    width;

  const baseAddress =
    parseAddress(
      layout.address,
    );

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );

  const values =
    Array.from(
      {
        length:
          rows,
      },
      (
        _,
        row,
      ) =>
        Array.from(
          {
            length:
              columns,
          },
          (
            __,
            column,
          ) => {
            const address =
              baseAddress +
              row *
                rowStride +
              column *
                columnStride;

            assertRange(
              bytes,
              address,
              layout.dataType,
            );

            return decodeScaled(
              readRaw(
                view,
                address,
                layout.dataType,
                layout.endian,
              ),
              layout.scale,
            );
          },
        ),
    );

  const xValues =
    layout.xAxisAddress &&
    layout.xAxisDataType
      ? axisValues(
          bytes,
          layout.xAxisAddress,
          columns,
          layout.xAxisDataType,
          layout.endian,
          layout.xAxisScale ?? {
            multiplier: 1,
            offset: 0,
          },
        )
      : [
          ...sourceMap.xAxis.values,
        ];

  const yValues =
    layout.yAxisAddress &&
    layout.yAxisDataType
      ? axisValues(
          bytes,
          layout.yAxisAddress,
          rows,
          layout.yAxisDataType,
          layout.endian,
          layout.yAxisScale ?? {
            multiplier: 1,
            offset: 0,
          },
        )
      : [
          ...sourceMap.yAxis.values,
        ];

  return {
    ...sourceMap,

    xAxis: {
      ...sourceMap.xAxis,
      values:
        xValues,
    },

    yAxis: {
      ...sourceMap.yAxis,
      values:
        yValues,
    },

    values,
  };
}

export function encodeTableToRom(
  bytes: Uint8Array,
  definition:
    CalibrationDefinition,
  map: EcuMap,
): Uint8Array {
  const layout =
    definition.binary;

  if (!layout) {
    throw new Error(
      `${definition.name} does not contain a binary table definition.`,
    );
  }

  const next =
    new Uint8Array(
      bytes,
    );

  const view =
    new DataView(
      next.buffer,
      next.byteOffset,
      next.byteLength,
    );

  const width =
    byteWidth(
      layout.dataType,
    );

  const columns =
    layout.columns ??
    map.values[0]
      ?.length ??
    0;

  const rowStride =
    layout.rowStrideBytes ??
    columns *
      width;

  const columnStride =
    layout.columnStrideBytes ??
    width;

  const baseAddress =
    parseAddress(
      layout.address,
    );

  map.values.forEach(
    (
      rowValues,
      row,
    ) => {
      rowValues.forEach(
        (
          value,
          column,
        ) => {
          const address =
            baseAddress +
            row *
              rowStride +
            column *
              columnStride;

          assertRange(
            next,
            address,
            layout.dataType,
          );

          writeRaw(
            view,
            address,
            layout.dataType,
            layout.endian,
            encodeScaled(
              value,
              layout.scale,
            ),
          );
        },
      );
    },
  );

  return next;
}

export function describeBinaryLayout(
  definition:
    CalibrationDefinition,
): string {
  if (!definition.binary) {
    return "NO BINARY BINDING";
  }

  const layout =
    definition.binary;

  return `${layout.address} · ${layout.dataType} · ${layout.endian}-endian · scale ${layout.scale.multiplier}x + ${layout.scale.offset}`;
}
