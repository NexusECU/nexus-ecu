import type {
  AdapterProfile,
} from "./adapterProfileTypes";

import type {
  EcuCapabilityEntry,
  EcuCapabilityMatrix,
  EcuCapabilityState,
} from "./ecuCapabilityTypes";

function entry(
  key: EcuCapabilityEntry["key"],
  label: string,
  state: EcuCapabilityState,
  reason: string,
): EcuCapabilityEntry {
  return {
    key,
    label,
    state,
    reason,
  };
}

export function buildEcuCapabilityMatrix(
  profile: AdapterProfile | null,
  adapterReady: boolean,
  linkReady: boolean,
  diagnosticResponderReady: boolean,
  identityReady: boolean,
  romImageLoaded: boolean,
): EcuCapabilityMatrix {
  const noProfile =
    !profile;

  const bridgeRequired =
    profile?.supportState ===
      "bridge-required";

  const planned =
    profile?.supportState ===
      "planned";

  const unsupported =
    profile?.supportState ===
      "unavailable";

  const hardwareReady =
    adapterReady &&
    linkReady;

  const entries:
    EcuCapabilityEntry[] = [];

  if (noProfile) {
    entries.push(
      entry(
        "identify",
        "ECU Identification",
        "blocked",
        "No adapter profile is selected.",
      ),
    );
  } else if (bridgeRequired) {
    entries.push(
      entry(
        "identify",
        "ECU Identification",
        "bridge-required",
        `${profile.displayName} requires ${profile.bridgeRequirement}.`,
      ),
    );
  } else if (planned || unsupported) {
    entries.push(
      entry(
        "identify",
        "ECU Identification",
        planned
          ? "not-implemented"
          : "unsupported",
        `${profile.displayName} is not available for live identification in this build.`,
      ),
    );
  } else if (!hardwareReady) {
    entries.push(
      entry(
        "identify",
        "ECU Identification",
        "blocked",
        "Adapter and hardware link must be connected first.",
      ),
    );
  } else {
    entries.push(
      entry(
        "identify",
        "ECU Identification",
        profile.standardDiagnostics
          ? "available"
          : "blocked",
        profile.standardDiagnostics
          ? "Standard diagnostic identification path is available."
          : "This provider profile does not currently expose standard diagnostics.",
      ),
    );
  }

  if (
    profile?.passiveReceive &&
    hardwareReady
  ) {
    entries.push(
      entry(
        "live-data",
        "Live Data / Passive Telemetry",
        "available",
        "Passive receive path is available for this provider.",
      ),
    );
  } else if (bridgeRequired) {
    entries.push(
      entry(
        "live-data",
        "Live Data / Passive Telemetry",
        "bridge-required",
        `${profile?.displayName ?? "Provider"} requires its native bridge before live traffic can be exposed.`,
      ),
    );
  } else {
    entries.push(
      entry(
        "live-data",
        "Live Data / Passive Telemetry",
        "blocked",
        hardwareReady
          ? "Passive receive is not enabled for this provider profile."
          : "Connect a supported adapter first.",
      ),
    );
  }

  entries.push(
    entry(
      "dtc-read",
      "Read DTCs",
      profile?.standardDiagnostics &&
      hardwareReady
        ? "available"
        : bridgeRequired
          ? "bridge-required"
          : "blocked",
      profile?.standardDiagnostics &&
      hardwareReady
        ? "Standard diagnostic read path is available."
        : bridgeRequired
          ? `${profile?.displayName ?? "Provider"} requires its native bridge.`
          : "Standard diagnostics are not ready on the selected provider/session.",
    ),
  );

  entries.push(
    entry(
      "dtc-clear",
      "Clear DTCs",
      "not-implemented",
      "NEXUS currently keeps active diagnostic write/control operations locked.",
    ),
  );

  entries.push(
    entry(
      "rom-read",
      "Read ROM from ECU",
      profile?.romRead
        ? diagnosticResponderReady &&
          identityReady
          ? "available"
          : "blocked"
        : bridgeRequired
          ? "bridge-required"
          : "not-implemented",
      profile?.romRead
        ? diagnosticResponderReady &&
          identityReady
          ? "Provider and ECU session meet the current ROM-read gate."
          : "Diagnostic responder and ECU identity evidence are required first."
        : bridgeRequired
          ? `${profile?.displayName ?? "Provider"} requires its native bridge before ROM read support can be evaluated.`
          : "Active ECU memory-read support is not implemented yet.",
    ),
  );

  entries.push(
    entry(
      "rom-backup",
      "ROM Backup",
      romImageLoaded
        ? "available"
        : "blocked",
      romImageLoaded
        ? "A ROM image is loaded and can be verified/exported as a backup."
        : "Load or acquire a ROM image first.",
    ),
  );

  entries.push(
    entry(
      "calibration-edit",
      "Offline Calibration Edit",
      romImageLoaded
        ? "available"
        : "blocked",
      romImageLoaded
        ? "Offline ROM calibration editing is available."
        : "Load a ROM image before editing calibration data.",
    ),
  );

  entries.push(
    entry(
      "rom-write",
      "Write / Flash ROM",
      "not-implemented",
      "ECU write/flash operations remain intentionally disabled.",
    ),
  );

  entries.push(
    entry(
      "recovery",
      "ECU Recovery",
      "not-implemented",
      "Recovery programming is not implemented in this build.",
    ),
  );

  return {
    entries,

    availableCount:
      entries.filter(
        item =>
          item.state ===
          "available",
      ).length,

    blockedCount:
      entries.filter(
        item =>
          item.state ===
          "blocked",
      ).length,

    bridgeRequiredCount:
      entries.filter(
        item =>
          item.state ===
          "bridge-required",
      ).length,

    notImplementedCount:
      entries.filter(
        item =>
          item.state ===
          "not-implemented",
      ).length,

    unsupportedCount:
      entries.filter(
        item =>
          item.state ===
          "unsupported",
      ).length,
  };
}
