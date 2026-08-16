import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  AddressRange,
  DefinitionValidationIssue,
} from "./definitionStudioTypes";

function parseAddress(
  value: string,
): number | null {
  const text =
    value.trim();

  if (!text) {
    return null;
  }

  const parsed =
    text.startsWith(
      "0x",
    ) ||
    text.startsWith(
      "0X",
    )
      ? Number.parseInt(
          text.slice(2),
          16,
        )
      : Number.parseInt(
          text,
          10,
        );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

function widthForType(
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
      return 0;
  }
}

function rangeForDefinition(
  definition:
    CalibrationDefinition,
): AddressRange | null {
  const binary =
    definition.binary;

  const address =
    parseAddress(
      binary?.address ??
      definition.address,
    );

  if (
    address === null
  ) {
    return null;
  }

  const dataType =
    binary?.dataType ??
    definition.dataType;

  const width =
    widthForType(
      dataType,
    );

  if (
    width <= 0
  ) {
    return null;
  }

  if (
    binary &&
    definition.map
  ) {
    const rows =
      binary.rows ??
      definition.map.values.length;

    const columns =
      binary.columns ??
      definition.map.values[0]
        ?.length ??
      0;

    const rowStride =
      binary.rowStrideBytes ??
      columns *
        width;

    const columnStride =
      binary.columnStrideBytes ??
      width;

    if (
      rows <= 0 ||
      columns <= 0
    ) {
      return null;
    }

    const lastAddress =
      address +
      (
        rows -
        1
      ) *
        rowStride +
      (
        columns -
        1
      ) *
        columnStride +
      width -
      1;

    return {
      definitionId:
        definition.id,

      start:
        address,

      end:
        lastAddress,

      label:
        definition.name,
    };
  }

  return {
    definitionId:
      definition.id,

    start:
      address,

    end:
      address +
      width -
      1,

    label:
      definition.name,
  };
}

export function validateDefinitions(
  definitions:
    CalibrationDefinition[],
): DefinitionValidationIssue[] {
  const issues:
    DefinitionValidationIssue[] = [];

  const ids =
    new Set<string>();

  definitions.forEach(
    (
      definition,
      index,
    ) => {
      const issueBase =
        `${definition.id || index}`;

      if (
        !definition.id.trim()
      ) {
        issues.push({
          id:
            `${issueBase}-missing-id`,
          severity:
            "error",
          definitionId:
            definition.id ||
            null,
          message:
            `Item ${index + 1} is missing an ID.`,
        });
      } else if (
        ids.has(
          definition.id,
        )
      ) {
        issues.push({
          id:
            `${issueBase}-duplicate-id`,
          severity:
            "error",
          definitionId:
            definition.id,
          message:
            `Duplicate definition ID: ${definition.id}`,
        });
      } else {
        ids.add(
          definition.id,
        );
      }

      if (
        !definition.name.trim()
      ) {
        issues.push({
          id:
            `${issueBase}-missing-name`,
          severity:
            "error",
          definitionId:
            definition.id ||
            null,
          message:
            "Definition name is required.",
        });
      }

      if (
        !definition.address.trim()
      ) {
        issues.push({
          id:
            `${issueBase}-missing-address`,
          severity:
            "warning",
          definitionId:
            definition.id ||
            null,
          message:
            `${definition.name || definition.id}: address is empty.`,
        });
      }

      const numericAddress =
        parseAddress(
          definition.binary?.address ??
          definition.address,
        );

      if (
        (
          definition.binary?.address ||
          definition.address
        ) &&
        numericAddress ===
          null
      ) {
        issues.push({
          id:
            `${issueBase}-bad-address`,
          severity:
            "error",
          definitionId:
            definition.id ||
            null,
          message:
            `${definition.name || definition.id}: address is invalid.`,
        });
      }

      if (
        definition.binary
      ) {
        if (
          definition.binary.scale.multiplier ===
          0
        ) {
          issues.push({
            id:
              `${issueBase}-zero-scale`,
            severity:
              "error",
            definitionId:
              definition.id,
            message:
              `${definition.name}: scale multiplier cannot be zero.`,
          });
        }

        if (
          definition.binary.rows !==
            undefined &&
          definition.binary.rows <=
            0
        ) {
          issues.push({
            id:
              `${issueBase}-rows`,
            severity:
              "error",
            definitionId:
              definition.id,
            message:
              `${definition.name}: rows must be greater than zero.`,
          });
        }

        if (
          definition.binary.columns !==
            undefined &&
          definition.binary.columns <=
            0
        ) {
          issues.push({
            id:
              `${issueBase}-columns`,
            severity:
              "error",
            definitionId:
              definition.id,
            message:
              `${definition.name}: columns must be greater than zero.`,
          });
        }
      }
    },
  );

  const ranges =
    definitions
      .map(
        rangeForDefinition,
      )
      .filter(
        (
          item,
        ): item is AddressRange =>
          item !== null,
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.start -
          b.start,
      );

  for (
    let index = 1;
    index <
    ranges.length;
    index++
  ) {
    const previous =
      ranges[
        index -
        1
      ];

    const current =
      ranges[
        index
      ];

    if (
      current.start <=
      previous.end
    ) {
      issues.push({
        id:
          `overlap-${previous.definitionId}-${current.definitionId}`,
        severity:
          "warning",
        definitionId:
          current.definitionId,
        message:
          `Address overlap: ${previous.label} (0x${previous.start.toString(16).toUpperCase()}–0x${previous.end.toString(16).toUpperCase()}) overlaps ${current.label} (0x${current.start.toString(16).toUpperCase()}–0x${current.end.toString(16).toUpperCase()}).`,
      });
    }
  }

  return issues;
}
