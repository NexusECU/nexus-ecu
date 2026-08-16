import {
  buildCalibrationDefinitions,
} from "../maps/calibrationDefinitionRegistry";

import {
  defaultBoostMap,
  defaultFuelMap,
  defaultIgnitionMap,
} from "../maps/defaultMaps";

import {
  buildLocalDefinitionProfiles,
} from "../definitions/definitionProfileDatabase";

import type {
  DefinitionProfile,
} from "../definitions/definitionDatabaseTypes";

import type {
  EcuDefinitionMatch,
  EcuMatchConfidence,
} from "./ecuMatchTypes";

function normalise(
  value:
    string | null | undefined,
): string {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase();
}

function confidenceForScore(
  score:
    number,
): EcuMatchConfidence {
  if (
    score >=
    80
  ) {
    return "high";
  }

  if (
    score >=
    50
  ) {
    return "medium";
  }

  if (
    score >
    0
  ) {
    return "low";
  }

  return "none";
}

function getDefinitionProfiles():
  DefinitionProfile[] {
  const definitions =
    buildCalibrationDefinitions({
      fuel:
        defaultFuelMap,

      ignition:
        defaultIgnitionMap,

      boost:
        defaultBoostMap,
    });

  return buildLocalDefinitionProfiles(
    definitions,
  );
}

export function matchEcuIdentityToDefinitions(
  vin:
    string | null,
  calibrationIds:
    string[],
  ecuNames:
    string[],
): EcuDefinitionMatch[] {
  const vinNorm =
    normalise(
      vin,
    );

  const calIds =
    calibrationIds.map(
      normalise,
    );

  const names =
    ecuNames.map(
      normalise,
    );

  const profiles =
    getDefinitionProfiles();

  return profiles
    .map(
      (
        definition:
          DefinitionProfile,
      ): EcuDefinitionMatch => {
        let score =
          0;

        const evidence:
          EcuDefinitionMatch["evidence"] =
          [];

        const definitionName =
          normalise(
            definition.name,
          );

        const ecuFamily =
          normalise(
            definition.ecuFamily,
          );

        const romId =
          normalise(
            definition.romId,
          );

        const romMatched =
          calIds.some(
            id =>
              Boolean(
                id &&
                romId &&
                (
                  romId.includes(
                    id,
                  ) ||
                  id.includes(
                    romId,
                  )
                ),
              ),
          );

        if (romMatched) {
          score +=
            70;
        }

        evidence.push({
          label:
            "Calibration / ROM ID",

          matched:
            romMatched,

          detail:
            romMatched
              ? `Observed calibration identity overlaps ${definition.romId}.`
              : `No overlap with ${definition.romId}.`,
        });

        const nameMatched =
          names.some(
            name =>
              Boolean(
                name &&
                (
                  definitionName.includes(
                    name,
                  ) ||
                  name.includes(
                    definitionName,
                  ) ||
                  ecuFamily.includes(
                    name,
                  ) ||
                  name.includes(
                    ecuFamily,
                  )
                ),
              ),
          );

        if (nameMatched) {
          score +=
            20;
        }

        evidence.push({
          label:
            "ECU Name / Family",

          matched:
            nameMatched,

          detail:
            nameMatched
              ? `Observed ECU identity overlaps ${definition.name} / ${definition.ecuFamily}.`
              : "No ECU-name or family match.",
        });

        const vinPresent =
          Boolean(
            vinNorm,
          );

        if (vinPresent) {
          score +=
            10;
        }

        evidence.push({
          label:
            "VIN Evidence",

          matched:
            vinPresent,

          detail:
            vinPresent
              ? "VIN is present and strengthens identity confidence."
              : "No VIN evidence observed.",
        });

        return {
          definitionId:
            definition.id,

          definitionName:
            definition.name,

          romId:
            definition.romId,

          score,

          confidence:
            confidenceForScore(
              score,
            ),

          evidence,
        };
      },
    )
    .sort(
      (
        a:
          EcuDefinitionMatch,
        b:
          EcuDefinitionMatch,
      ) =>
        b.score -
        a.score,
    );
}

export function buildEcuCapabilityMatchSummary(
  vin:
    string | null,
  calibrationIds:
    string[],
  ecuNames:
    string[],
) {
  const candidates =
    matchEcuIdentityToDefinitions(
      vin,
      calibrationIds,
      ecuNames,
    );

  const bestMatch =
    candidates.find(
      candidate =>
        candidate.score >
        0,
    ) ??
    null;

  const identityReady =
    Boolean(
      vin ||
      calibrationIds.length ||
      ecuNames.length,
    );

  return {
    bestMatch,

    candidates,

    identityReady,

    compatibilityText:
      bestMatch
        ? bestMatch.confidence ===
          "high"
          ? "Strong definition match. Use matched-definition capabilities as the primary compatibility guide."
          : bestMatch.confidence ===
            "medium"
            ? "Partial definition match. Verify ROM/Calibration ID before relying on definition-specific capabilities."
            : "Weak definition match. Treat as provisional until stronger identity evidence is available."
        : identityReady
          ? "ECU identity evidence exists, but no known calibration definition currently matches it."
          : "No ECU identity evidence is available yet.",
  };
}
