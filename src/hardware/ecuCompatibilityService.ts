import type {
  EcuCompatibilityFactor,
  EcuCompatibilitySummary,
} from "./ecuCompatibilityTypes";

import type {
  EcuDefinitionMatch,
} from "./ecuMatchTypes";

import type {
  EcuCapabilityMatrix,
} from "./ecuCapabilityTypes";

export function buildEcuCompatibilitySummary(
  identityReady:
    boolean,
  bestDefinitionMatch:
    EcuDefinitionMatch | null,
  capabilityMatrix:
    EcuCapabilityMatrix,
  transportConnected:
    boolean,
  responderDetected:
    boolean,
  romLoaded:
    boolean,
): EcuCompatibilitySummary {
  const factors:
    EcuCompatibilityFactor[] = [
      {
        id:
          "identity",

        label:
          "ECU Identity",

        passed:
          identityReady,

        weight:
          20,

        detail:
          identityReady
            ? "VIN, calibration identity, ECU name, or equivalent identity evidence is available."
            : "No reliable ECU identity evidence is available yet.",
      },

      {
        id:
          "definition",

        label:
          "Definition Match",

        passed:
          Boolean(
            bestDefinitionMatch &&
            bestDefinitionMatch.score >=
              50,
          ),

        weight:
          25,

        detail:
          bestDefinitionMatch
            ? `${bestDefinitionMatch.definitionName} matched at ${bestDefinitionMatch.score}/100 (${bestDefinitionMatch.confidence} confidence).`
            : "No matching calibration definition was found.",
      },

      {
        id:
          "transport",

        label:
          "Transport Link",

        passed:
          transportConnected,

        weight:
          15,

        detail:
          transportConnected
            ? "The selected hardware transport is connected."
            : "No live transport link is currently connected.",
      },

      {
        id:
          "responder",

        label:
          "Diagnostic Responder",

        passed:
          responderDetected,

        weight:
          15,

        detail:
          responderDetected
            ? "A standard diagnostic responder has been observed."
            : "No standard diagnostic responder has been confirmed.",
      },

      {
        id:
          "capabilities",

        label:
          "Usable Capabilities",

        passed:
          capabilityMatrix.availableCount >
          0,

        weight:
          15,

        detail:
          `${capabilityMatrix.availableCount} operation(s) currently available; ${capabilityMatrix.blockedCount} blocked; ${capabilityMatrix.bridgeRequiredCount} bridge-required.`,
      },

      {
        id:
          "rom",

        label:
          "ROM Context",

        passed:
          romLoaded,

        weight:
          10,

        detail:
          romLoaded
            ? "A ROM image is loaded for offline comparison/backup context."
            : "No ROM image is currently loaded.",
      },
    ];

  const score =
    factors.reduce(
      (
        total,
        factor,
      ) =>
        total +
        (
          factor.passed
            ? factor.weight
            : 0
        ),
      0,
    );

  const confidence =
    Math.min(
      100,
      Math.round(
        (
          (
            identityReady
              ? 25
              : 0
          ) +
          (
            bestDefinitionMatch
              ? bestDefinitionMatch.score *
                0.5
              : 0
          ) +
          (
            responderDetected
              ? 15
              : 0
          ) +
          (
            transportConnected
              ? 10
              : 0
          )
        ),
      ),
    );

  let verdict:
    EcuCompatibilitySummary["verdict"] =
      "unknown";

  if (
    score >= 80 &&
    bestDefinitionMatch?.confidence ===
      "high"
  ) {
    verdict =
      "supported";
  } else if (
    score >= 60
  ) {
    verdict =
      "provisional";
  } else if (
    score >= 35
  ) {
    verdict =
      "limited";
  } else if (
    identityReady ||
    transportConnected
  ) {
    verdict =
      "blocked";
  }

  const recommendations:
    EcuCompatibilitySummary["recommendations"] =
      [];

  if (!transportConnected) {
    recommendations.push({
      priority:
        "high",

      title:
        "Connect the saved hardware profile",

      detail:
        "Open a supported adapter/provider link before relying on live ECU compatibility.",
    });
  }

  if (!responderDetected) {
    recommendations.push({
      priority:
        "high",

      title:
        "Confirm ECU responder",

      detail:
        "Observe a diagnostic responder before treating this controller as positively detected.",
    });
  }

  if (!identityReady) {
    recommendations.push({
      priority:
        "high",

      title:
        "Acquire identity evidence",

      detail:
        "Capture VIN, Calibration ID, ECU name, or other supported passive identity data.",
    });
  }

  if (
    bestDefinitionMatch &&
    bestDefinitionMatch.score <
      80
  ) {
    recommendations.push({
      priority:
        "medium",

      title:
        "Verify definition match",

      detail:
        `Current best match is ${bestDefinitionMatch.definitionName} at ${bestDefinitionMatch.score}/100. Verify ROM/Calibration ID before definition-specific work.`,
    });
  }

  if (!bestDefinitionMatch) {
    recommendations.push({
      priority:
        "medium",

      title:
        "Add or select a compatible definition",

      detail:
        "No known definition matches the current identity evidence.",
    });
  }

  if (
    capabilityMatrix.availableCount ===
    0
  ) {
    recommendations.push({
      priority:
        "medium",

      title:
        "Resolve capability blockers",

      detail:
        "The selected provider/session currently exposes no available ECU operations.",
    });
  }

  if (!romLoaded) {
    recommendations.push({
      priority:
        "low",

      title:
        "Load a reference ROM",

      detail:
        "A verified ROM image improves offline comparison, backup, and calibration context.",
    });
  }

  return {
    verdict,

    score,

    confidence,

    factors,

    recommendations,

    summaryText:
      verdict ===
        "supported"
        ? "Strong compatibility evidence is present across identity, definition, transport, responder, and capability layers."
        : verdict ===
          "provisional"
          ? "Compatibility looks promising but one or more important checks still require verification."
          : verdict ===
            "limited"
            ? "Some compatibility evidence is present, but support is currently limited."
            : verdict ===
              "blocked"
              ? "The ECU/project cannot currently be treated as compatible because required evidence or transport capability is missing."
              : "Not enough information is available to assess ECU compatibility yet.",
  };
}
