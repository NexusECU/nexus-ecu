import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  CandidateMap,
  DefinitionMatch,
  DefinitionProfile,
  RomFingerprint,
} from "./definitionDatabaseTypes";

function estimateEntropy(
  bytes: Uint8Array,
): number {
  if (!bytes.length) {
    return 0;
  }

  const counts =
    new Array<number>(
      256,
    ).fill(
      0,
    );

  const step =
    Math.max(
      1,
      Math.floor(
        bytes.length /
        65536,
      ),
    );

  let sampled = 0;

  for (
    let index = 0;
    index <
    bytes.length;
    index +=
    step
  ) {
    counts[
      bytes[index]
    ]++;

    sampled++;
  }

  let entropy = 0;

  counts.forEach(
    (count) => {
      if (
        count === 0
      ) {
        return;
      }

      const probability =
        count /
        sampled;

      entropy -=
        probability *
        Math.log2(
          probability,
        );
    },
  );

  return entropy;
}

export async function fingerprintRom(
  bytes: Uint8Array,
): Promise<RomFingerprint> {
  const digestInput =
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset +
        bytes.byteLength,
    ) as ArrayBuffer;

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      digestInput,
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

  let zeros = 0;
  let ffs = 0;

  bytes.forEach(
    (value) => {
      if (
        value === 0
      ) {
        zeros++;
      }

      if (
        value === 0xff
      ) {
        ffs++;
      }
    },
  );

  return {
    sizeBytes:
      bytes.length,

    sha256Prefix:
      sha256.slice(
        0,
        16,
      ),

    entropyEstimate:
      estimateEntropy(
        bytes,
      ),

    zeroByteRatio:
      bytes.length
        ? zeros /
          bytes.length
        : 0,

    ffByteRatio:
      bytes.length
        ? ffs /
          bytes.length
        : 0,
  };
}

export function matchDefinitionProfiles(
  fingerprint:
    RomFingerprint,
  profiles:
    DefinitionProfile[],
): DefinitionMatch[] {
  return profiles
    .map(
      (profile) => {
        let score = 0;
        const reasons:
          string[] = [];

        if (
          profile.expectedSizeBytes !==
          null
        ) {
          if (
            profile.expectedSizeBytes ===
            fingerprint.sizeBytes
          ) {
            score += 60;
            reasons.push(
              "ROM size exact match",
            );
          } else {
            const delta =
              Math.abs(
                profile.expectedSizeBytes -
                fingerprint.sizeBytes,
              );

            const tolerance =
              Math.max(
                1024,
                profile.expectedSizeBytes *
                  0.05,
              );

            if (
              delta <=
              tolerance
            ) {
              score += 20;
              reasons.push(
                "ROM size near match",
              );
            }
          }
        }

        if (
          profile.sha256Prefix &&
          fingerprint.sha256Prefix
            .toLowerCase()
            .startsWith(
              profile.sha256Prefix
                .toLowerCase(),
            )
        ) {
          score += 40;
          reasons.push(
            "SHA-256 fingerprint match",
          );
        }

        return {
          profileId:
            profile.id,

          score:
            Math.min(
              100,
              score,
            ),

          reasons,
        };
      },
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.score -
        a.score,
    );
}

function readUint16(
  view: DataView,
  offset: number,
  little: boolean,
): number {
  return view.getUint16(
    offset,
    little,
  );
}

function readInt16(
  view: DataView,
  offset: number,
  little: boolean,
): number {
  return view.getInt16(
    offset,
    little,
  );
}

function scoreMatrix(
  values: number[][],
): {
  score: number;
  min: number;
  max: number;
  average: number;
  smoothness: number;
} {
  const flat =
    values.flat();

  if (
    !flat.length
  ) {
    return {
      score: 0,
      min: 0,
      max: 0,
      average: 0,
      smoothness: 0,
    };
  }

  let differences = 0;
  let pairs = 0;

  values.forEach(
    (
      row,
      rowIndex,
    ) => {
      row.forEach(
        (
          value,
          columnIndex,
        ) => {
          const right =
            row[
              columnIndex +
              1
            ];

          if (
            right !==
            undefined
          ) {
            differences +=
              Math.abs(
                right -
                value,
              );

            pairs++;
          }

          const below =
            values[
              rowIndex +
              1
            ]?.[
              columnIndex
            ];

          if (
            below !==
            undefined
          ) {
            differences +=
              Math.abs(
                below -
                value,
              );

            pairs++;
          }
        },
      );
    },
  );

  const min =
    Math.min(
      ...flat,
    );

  const max =
    Math.max(
      ...flat,
    );

  const average =
    flat.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    flat.length;

  const range =
    Math.max(
      1,
      max -
      min,
    );

  const meanDifference =
    pairs
      ? differences /
        pairs
      : range;

  const smoothness =
    Math.max(
      0,
      1 -
        meanDifference /
          range,
    );

  const nonConstant =
    range >
      2
      ? 1
      : 0;

  const reasonableRange =
    max <
      65535 &&
    min >
      -32768
      ? 1
      : 0;

  const score =
    (
      smoothness *
        65 +
      nonConstant *
        20 +
      reasonableRange *
        15
    );

  return {
    score,
    min,
    max,
    average,
    smoothness,
  };
}

export function discoverCandidateMaps(
  bytes: Uint8Array,
  maximumCandidates = 80,
): CandidateMap[] {
  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );

  const shapes = [
    [8, 8],
    [8, 12],
    [8, 16],
    [10, 10],
    [12, 12],
    [12, 16],
    [16, 16],
  ] as const;

  const candidates:
    CandidateMap[] = [];

  const maxScanBytes =
    Math.min(
      bytes.length,
      2 * 1024 * 1024,
    );

  const stride =
    16;

  for (
    let offset = 0;
    offset <
    maxScanBytes -
      512;
    offset +=
    stride
  ) {
    for (
      const [
        rows,
        columns,
      ] of shapes
    ) {
      const cellCount =
        rows *
        columns;

      const byteLength =
        cellCount *
        2;

      if (
        offset +
        byteLength >
        maxScanBytes
      ) {
        continue;
      }

      for (
        const endian of [
          "little",
          "big",
        ] as const
      ) {
        for (
          const dataType of [
            "uint16",
            "int16",
          ] as const
        ) {
          const little =
            endian ===
            "little";

          const matrix:
            number[][] = [];

          let cursor =
            offset;

          for (
            let row = 0;
            row <
            rows;
            row++
          ) {
            const values:
              number[] = [];

            for (
              let column = 0;
              column <
              columns;
              column++
            ) {
              const value =
                dataType ===
                "uint16"
                  ? readUint16(
                      view,
                      cursor,
                      little,
                    )
                  : readInt16(
                      view,
                      cursor,
                      little,
                    );

              values.push(
                value,
              );

              cursor +=
                2;
            }

            matrix.push(
              values,
            );
          }

          const scored =
            scoreMatrix(
              matrix,
            );

          if (
            scored.score <
            72
          ) {
            continue;
          }

          candidates.push({
            id:
              `candidate-${offset}-${rows}-${columns}-${dataType}-${endian}`,

            offset,

            dataType,

            endian,

            rows,

            columns,

            score:
              scored.score,

            min:
              scored.min,

            max:
              scored.max,

            average:
              scored.average,

            smoothness:
              scored.smoothness,

            reason:
              "Smooth structured numeric region with non-trivial value range",
          });
        }
      }
    }
  }

  return candidates
    .sort(
      (
        a,
        b,
      ) =>
        b.score -
        a.score,
    )
    .slice(
      0,
      maximumCandidates,
    );
}

export function candidateToDefinition(
  candidate:
    CandidateMap,
): CalibrationDefinition {
  return {
    id:
      `discovered-${candidate.offset.toString(16)}`,

    name:
      `Discovered Table 0x${candidate.offset.toString(16).toUpperCase()}`,

    category:
      "Miscellaneous",

    type:
      "table-3d",

    mapKind:
      null,

    description:
      `Candidate table discovered by NEXUS at ROM offset 0x${candidate.offset.toString(16).toUpperCase()}. Confidence ${candidate.score.toFixed(1)}%. Review before use.`,

    unit:
      "",

    address:
      `0x${candidate.offset.toString(16).toUpperCase()}`,

    dataType:
      candidate.dataType,

    readOnly:
      false,

    binary: {
      address:
        `0x${candidate.offset.toString(16).toUpperCase()}`,

      dataType:
        candidate.dataType,

      endian:
        candidate.endian,

      scale: {
        multiplier:
          1,

        offset:
          0,
      },

      rows:
        candidate.rows,

      columns:
        candidate.columns,
    },
  };
}
