import type {
  EcuDefinitionMatch,
} from "./ecuMatchTypes";

import type {
  RomImageInfo,
} from "../rom/romTypes";

import type {
  CalibrationBindingCheck,
  CalibrationBindingSummary,
} from "./calibrationBindingTypes";

function normalise(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      "",
    );
}

export function buildCalibrationBindingSummary(
  projectLabel:
    string,
  vin:
    string | null,
  calibrationIds:
    string[],
  bestDefinitionMatch:
    EcuDefinitionMatch | null,
  loadedRomImage:
    RomImageInfo | null,
): CalibrationBindingSummary {
  const calibrationId =
    calibrationIds[0] ??
    null;

  const definitionRomId =
    bestDefinitionMatch?.romId ??
    null;

  const romFileName =
    loadedRomImage?.fileName ??
    null;

  const calNorm =
    normalise(
      calibrationId,
    );

  const defNorm =
    normalise(
      definitionRomId,
    );

  const romNameNorm =
    normalise(
      romFileName,
    );

  const checks: CalibrationBindingCheck[] = [
    {
      id: "project",
      label: "Project Context",
      passed: Boolean(projectLabel),
      detail: projectLabel
        ? `Active project context: ${projectLabel}.`
        : "No active vehicle/project context is available.",
    },
    {
      id: "identity",
      label: "ECU Calibration Identity",
      passed: Boolean(calibrationId),
      detail: calibrationId
        ? `Observed Calibration ID: ${calibrationId}.`
        : "No Calibration ID has been observed.",
    },
    {
      id: "definition",
      label: "Definition Binding",
      passed: Boolean(bestDefinitionMatch),
      detail: bestDefinitionMatch
        ? `${bestDefinitionMatch.definitionName} selected at ${bestDefinitionMatch.score}/100 confidence score.`
        : "No matched calibration definition is available.",
    },
    {
      id: "definition-rom",
      label: "Calibration ↔ Definition ROM ID",
      passed:
        Boolean(
          calNorm &&
          defNorm &&
          (
            calNorm.includes(defNorm) ||
            defNorm.includes(calNorm)
          ),
        ),
      detail:
        calNorm &&
        defNorm
          ? (
              calNorm.includes(defNorm) ||
              defNorm.includes(calNorm)
            )
            ? `Observed Calibration ID agrees with definition ROM ID ${definitionRomId}.`
            : `Observed Calibration ID ${calibrationId} does not agree with definition ROM ID ${definitionRomId}.`
          : "Calibration ID and definition ROM ID are both required for this verification.",
    },
    {
      id: "rom",
      label: "Loaded ROM",
      passed: Boolean(loadedRomImage),
      detail: loadedRomImage
        ? `${loadedRomImage.fileName} · ${loadedRomImage.bytes.length.toLocaleString()} bytes · SHA-256 ${loadedRomImage.sha256.slice(0, 16)}…`
        : "No ROM image is loaded.",
    },
    {
      id: "rom-name-hint",
      label: "ROM ↔ Definition Name Hint",
      passed:
        Boolean(
          romNameNorm &&
          defNorm &&
          (
            romNameNorm.includes(defNorm) ||
            defNorm.includes(romNameNorm)
          ),
        ),
      detail:
        romNameNorm &&
        defNorm
          ? (
              romNameNorm.includes(defNorm) ||
              defNorm.includes(romNameNorm)
            )
            ? "ROM filename contains identity consistent with the matched definition."
            : "ROM filename does not contain the matched definition ROM ID. This is advisory only."
          : "ROM and definition context are required for filename-hint verification.",
    },
  ];

  const requiredIds =
    new Set([
      "project",
      "identity",
      "definition",
      "definition-rom",
      "rom",
    ]);

  const requiredChecks =
    checks.filter(
      check =>
        requiredIds.has(
          check.id,
        ),
    );

  const passedRequired =
    requiredChecks.filter(
      check => check.passed,
    ).length;

  const hardMismatch =
    Boolean(
      calibrationId &&
      definitionRomId &&
      !checks.find(
        check =>
          check.id ===
          "definition-rom",
      )?.passed,
    );

  const score =
    Math.round(
      checks.filter(
        check => check.passed,
      ).length /
      checks.length *
      100,
    );

  let status:
    CalibrationBindingSummary["status"] =
      "unbound";

  if (hardMismatch) {
    status = "mismatch";
  } else if (
    passedRequired ===
    requiredChecks.length
  ) {
    status = "verified";
  } else if (
    passedRequired >=
    2
  ) {
    status = "partial";
  }

  return {
    status,
    score,
    checks,
    projectLabel:
      projectLabel ||
      "No active project",
    vin,
    calibrationId,
    definitionName:
      bestDefinitionMatch?.definitionName ??
      null,
    definitionRomId,
    romFileName,
    romSha256:
      loadedRomImage?.sha256 ??
      null,
    summaryText:
      status === "verified"
        ? "Project, ECU calibration identity, matched definition, and loaded ROM are bound into one verified calibration context."
        : status === "mismatch"
          ? "The observed ECU calibration identity conflicts with the matched definition. Do not rely on definition-specific calibration workflows until this mismatch is resolved."
          : status === "partial"
            ? "Some calibration context is available, but verification is incomplete."
            : "There is not enough information to create a calibration binding yet.",
  };
}
