import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  NexusDefinitionFile,
} from "../maps/definitionFileTypes";

import type {
  RomByteChange,
  RomValidationIssue,
  RomValidationReport,
} from "./romValidationTypes";

function parseAddress(
  text: string,
): number | null {
  const value =
    text.trim();

  if (!value) {
    return null;
  }

  const parsed =
    value.startsWith("0x") ||
    value.startsWith("0X")
      ? Number.parseInt(
          value.slice(
            2,
          ),
          16,
        )
      : Number.parseInt(
          value,
          10,
        );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
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
      return 0;
  }
}

function definitionRanges(
  definitions:
    CalibrationDefinition[],
): Array<{
  id: string;
  name: string;
  start: number;
  end: number;
}> {
  const ranges:
    Array<{
      id: string;
      name: string;
      start: number;
      end: number;
    }> = [];

  definitions.forEach(
    (definition) => {
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
        return;
      }

      const dataType =
        binary?.dataType ??
        definition.dataType;

      const width =
        byteWidth(
          dataType,
        );

      if (
        width <= 0
      ) {
        return;
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

        if (
          rows <= 0 ||
          columns <= 0
        ) {
          return;
        }

        const rowStride =
          binary.rowStrideBytes ??
          columns *
            width;

        const columnStride =
          binary.columnStrideBytes ??
          width;

        const end =
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

        ranges.push({
          id:
            definition.id,

          name:
            definition.name,

          start:
            address,

          end,
        });

        return;
      }

      ranges.push({
        id:
          definition.id,

        name:
          definition.name,

        start:
          address,

        end:
          address +
          width -
          1,
      });
    },
  );

  return ranges;
}

export function diffRomBytes(
  original:
    Uint8Array,
  current:
    Uint8Array,
): RomByteChange[] {
  const length =
    Math.min(
      original.length,
      current.length,
    );

  const changes:
    RomByteChange[] = [];

  for (
    let offset = 0;
    offset <
    length;
    offset++
  ) {
    if (
      original[
        offset
      ] !==
      current[
        offset
      ]
    ) {
      changes.push({
        offset,

        before:
          original[
            offset
          ],

        after:
          current[
            offset
          ],
      });
    }
  }

  return changes;
}

export function countChangedRanges(
  changes:
    RomByteChange[],
): number {
  if (
    changes.length ===
    0
  ) {
    return 0;
  }

  let ranges = 1;

  for (
    let index = 1;
    index <
    changes.length;
    index++
  ) {
    if (
      changes[
        index
      ].offset !==
      changes[
        index -
        1
      ].offset +
        1
    ) {
      ranges++;
    }
  }

  return ranges;
}

export function validateRomImage(
  original:
    Uint8Array,
  current:
    Uint8Array,
  definitions:
    CalibrationDefinition[],
  definitionFile:
    NexusDefinitionFile | null,
): RomValidationReport {
  const issues:
    RomValidationIssue[] = [];

  if (
    original.length !==
    current.length
  ) {
    issues.push({
      id:
        "rom-size-changed",

      severity:
        "error",

      title:
        "ROM size changed",

      detail:
        `Original image is ${original.length} bytes but the current image is ${current.length} bytes.`,
    });
  }

  if (
    current.length ===
    0
  ) {
    issues.push({
      id:
        "rom-empty",

      severity:
        "error",

      title:
        "ROM image is empty",

      detail:
        "A zero-byte image cannot be validated or exported safely.",
    });
  }

  const ranges =
    definitionRanges(
      definitions,
    );

  ranges.forEach(
    (range) => {
      if (
        range.start <
          0 ||
        range.end >=
          current.length
      ) {
        issues.push({
          id:
            `range-${range.id}`,

          severity:
            "error",

          title:
            "Definition outside ROM",

          detail:
            `${range.name} references 0x${range.start.toString(16).toUpperCase()}–0x${range.end.toString(16).toUpperCase()}, outside the ${current.length}-byte ROM image.`,
        });
      }
    },
  );

  const sortedRanges =
    [
      ...ranges,
    ].sort(
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
    sortedRanges.length;
    index++
  ) {
    const previous =
      sortedRanges[
        index -
        1
      ];

    const currentRange =
      sortedRanges[
        index
      ];

    if (
      currentRange.start <=
      previous.end
    ) {
      issues.push({
        id:
          `overlap-${previous.id}-${currentRange.id}`,

        severity:
          "warning",

        title:
          "Definition overlap",

        detail:
          `${previous.name} overlaps ${currentRange.name} in the ROM address space.`,
      });
    }
  }

  if (
    definitionFile
  ) {
    if (
      !definitionFile.romId.trim()
    ) {
      issues.push({
        id:
          "definition-rom-id-empty",

        severity:
          "warning",

        title:
          "ROM ID not configured",

        detail:
          "The active external definition does not specify a ROM ID, so automatic compatibility matching is limited.",
      });
    } else {
      issues.push({
        id:
          "definition-rom-id-present",

        severity:
          "info",

        title:
          "Definition ROM ID available",

        detail:
          `Active definition ROM ID: ${definitionFile.romId}`,
      });
    }
  } else {
    issues.push({
      id:
        "builtin-definition",

      severity:
        "info",

      title:
        "Built-in definition active",

      detail:
        "NEXUS is validating this ROM against the built-in development definition.",
    });
  }

  const changes =
    diffRomBytes(
      original,
      current,
    );

  const changedRanges =
    countChangedRanges(
      changes,
    );

  if (
    changes.length ===
    0
  ) {
    issues.push({
      id:
        "no-modifications",

      severity:
        "info",

      title:
        "No ROM modifications",

      detail:
        "The current ROM buffer matches the originally loaded image.",
    });
  } else {
    issues.push({
      id:
        "rom-modified",

      severity:
        "warning",

      title:
        "ROM has modifications",

      detail:
        `${changes.length} byte(s) changed across ${changedRanges} contiguous range(s).`,
    });
  }

  const errors =
    issues.filter(
      (issue) =>
        issue.severity ===
        "error",
    ).length;

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity ===
        "warning",
    ).length;

  const infos =
    issues.filter(
      (issue) =>
        issue.severity ===
        "info",
    ).length;

  return {
    valid:
      errors ===
      0,

    issueCount:
      issues.length,

    errors,

    warnings,

    infos,

    modifiedBytes:
      changes.length,

    changedRanges,

    checksumStatus:
      changes.length ===
      0
        ? "unchanged"
        : "not-configured",

    generatedAt:
      new Date()
        .toISOString(),

    issues,
  };
}
