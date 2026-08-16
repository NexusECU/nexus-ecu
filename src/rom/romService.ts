import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  RomImageInfo,
  RomScalarBinding,
} from "./romTypes";

function parseAddress(
  address: string,
): number {
  const trimmed =
    address.trim();

  if (
    trimmed.startsWith(
      "0x",
    ) ||
    trimmed.startsWith(
      "0X",
    )
  ) {
    return Number.parseInt(
      trimmed.slice(
        2,
      ),
      16,
    );
  }

  return Number.parseInt(
    trimmed,
    10,
  );
}

function dataWidth(
  dataType: string,
): number {
  switch (dataType) {
    case "boolean":
    case "uint8":
      return 1;

    case "uint16":
    case "int16":
      return 2;

    case "float32":
    case "uint32":
    case "int32":
      return 4;

    default:
      return 0;
  }
}

function decodeValue(
  bytes: Uint8Array,
  address: number,
  dataType: string,
): number | boolean {
  const width =
    dataWidth(
      dataType,
    );

  if (
    width <= 0 ||
    address < 0 ||
    address + width >
      bytes.length
  ) {
    throw new Error(
      "Definition address is outside the ROM image.",
    );
  }

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );

  switch (dataType) {
    case "boolean":
      return view.getUint8(
        address,
      ) !== 0;

    case "uint8":
      return view.getUint8(
        address,
      );

    case "uint16":
      return view.getUint16(
        address,
        true,
      );

    case "int16":
      return view.getInt16(
        address,
        true,
      );

    case "uint32":
      return view.getUint32(
        address,
        true,
      );

    case "int32":
      return view.getInt32(
        address,
        true,
      );

    case "float32":
      return view.getFloat32(
        address,
        true,
      );

    default:
      throw new Error(
        `Unsupported ROM data type: ${dataType}`,
      );
  }
}

function encodeValue(
  bytes: Uint8Array,
  address: number,
  dataType: string,
  value: number | boolean,
): void {
  const width =
    dataWidth(
      dataType,
    );

  if (
    width <= 0 ||
    address < 0 ||
    address + width >
      bytes.length
  ) {
    throw new Error(
      "Definition address is outside the ROM image.",
    );
  }

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );

  switch (dataType) {
    case "boolean":
      view.setUint8(
        address,
        value
          ? 1
          : 0,
      );
      return;

    case "uint8":
      view.setUint8(
        address,
        Number(
          value,
        ),
      );
      return;

    case "uint16":
      view.setUint16(
        address,
        Number(
          value,
        ),
        true,
      );
      return;

    case "int16":
      view.setInt16(
        address,
        Number(
          value,
        ),
        true,
      );
      return;

    case "uint32":
      view.setUint32(
        address,
        Number(
          value,
        ),
        true,
      );
      return;

    case "int32":
      view.setInt32(
        address,
        Number(
          value,
        ),
        true,
      );
      return;

    case "float32":
      view.setFloat32(
        address,
        Number(
          value,
        ),
        true,
      );
      return;

    default:
      throw new Error(
        `Unsupported ROM data type: ${dataType}`,
      );
  }
}

export async function buildRomImageInfo(
  file: File,
): Promise<RomImageInfo> {
  const buffer =
    await file.arrayBuffer();

  const bytes =
    new Uint8Array(
      buffer,
    );

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      buffer,
    );

  const sha256 =
    Array.from(
      new Uint8Array(
        digest,
      ),
    )
      .map(
        (value) =>
          value
            .toString(
              16,
            )
            .padStart(
              2,
              "0",
            ),
      )
      .join("");

  return {
    fileName:
      file.name,

    sizeBytes:
      bytes.length,

    sha256,

    loadedAt:
      new Date()
        .toISOString(),

    bytes,
  };
}

export function bindDefinitionsToRom(
  image:
    RomImageInfo,
  definitions:
    CalibrationDefinition[],
): RomScalarBinding[] {
  return definitions
    .filter(
      (definition) =>
        definition.type !==
          "table-3d" &&
        definition.type !==
          "table-2d" &&
        definition.type !==
          "curve-1d",
    )
    .map(
      (definition) => {
        const address =
          parseAddress(
            definition.address,
          );

        try {
          const value =
            decodeValue(
              image.bytes,
              address,
              definition.dataType,
            );

          return {
            definitionId:
              definition.id,

            address,

            dataType:
              definition.dataType,

            unit:
              definition.unit,

            originalValue:
              value,

            currentValue:
              value,

            valid:
              true,

            error:
              null,
          };
        } catch (
          caught
        ) {
          return {
            definitionId:
              definition.id,

            address,

            dataType:
              definition.dataType,

            unit:
              definition.unit,

            originalValue:
              null,

            currentValue:
              null,

            valid:
              false,

            error:
              caught instanceof Error
                ? caught.message
                : String(
                    caught,
                  ),
          };
        }
      },
    );
}

export function patchRomScalar(
  image:
    RomImageInfo,
  binding:
    RomScalarBinding,
  value:
    number | boolean,
): Uint8Array {
  const next =
    new Uint8Array(
      image.bytes,
    );

  encodeValue(
    next,
    binding.address,
    binding.dataType,
    value,
  );

  return next;
}
