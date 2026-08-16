import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import type {
  ProjectRestorePreview,
  RestoreItem,
} from "./projectRestoreTypes";

function item(
  id: string,
  label: string,
  value: string,
  capability: RestoreItem["capability"],
  detail: string,
): RestoreItem {
  return {
    id,
    label,
    value,
    capability,
    detail,
  };
}

export function buildProjectRestorePreview(
  state: NexusProjectSessionState,
): ProjectRestorePreview {
  const items: RestoreItem[] = [
    item(
      "provider",
      "Adapter Provider",
      state.hardware.providerId.toUpperCase(),
      "auto",
      "Provider selection can be restored automatically.",
    ),
    item(
      "port",
      "Serial Port",
      state.hardware.selectedPort || "NONE",
      state.hardware.selectedPort
        ? "manual"
        : "unavailable",
      state.hardware.selectedPort
        ? "The previous port is remembered, but NEXUS will not auto-open it."
        : "No serial port was saved.",
    ),
    item(
      "baud",
      "Serial Baud",
      String(state.hardware.serialBaud),
      "auto",
      "Serial baud preference can be restored automatically.",
    ),
    item(
      "can-bitrate",
      "CAN Bitrate",
      `${state.hardware.canBitrateKbps} KBIT/S`,
      "auto",
      "CAN bitrate preference can be restored automatically.",
    ),
    item(
      "workspace-tab",
      "Workspace Tab",
      state.hardware.workspaceTab.toUpperCase(),
      "auto",
      "The last ECU workspace tab can be reopened automatically.",
    ),
    item(
      "ecu-address",
      "ECU Address",
      state.hardware.selectedEcuAddress || "AUTO",
      "auto",
      "The selected ECU address preference can be restored.",
    ),
    item(
      "identity",
      "ECU Identity",
      state.hardware.identity.vin ||
        state.hardware.identity.calibrationIds.join(" · ") ||
        "UNKNOWN",
      "auto",
      "Previously observed identity evidence can be restored as historical session metadata.",
    ),
    item(
      "rom",
      "ROM Binding",
      state.rom?.fileName ?? "NONE",
      state.rom
        ? "manual"
        : "unavailable",
      state.rom
        ? "ROM metadata is restored, but NEXUS will not reopen file bytes automatically."
        : "No ROM was bound to the saved session.",
    ),
    item(
      "definition",
      "Definition Binding",
      state.definition?.name ?? "NONE",
      state.definition
        ? "manual"
        : "unavailable",
      state.definition
        ? "Definition metadata is restored, but the actual definition file must be available."
        : "No definition was bound to the saved session.",
    ),
    item(
      "hardware-link",
      "Hardware Connection",
      "MANUAL RECONNECT REQUIRED",
      "manual",
      "For safety, NEXUS never reconnects hardware automatically on startup.",
    ),
  ];

  return {
    state,

    items,

    automaticCount:
      items.filter(
        entry =>
          entry.capability ===
          "auto",
      ).length,

    manualCount:
      items.filter(
        entry =>
          entry.capability ===
          "manual",
      ).length,

    unavailableCount:
      items.filter(
        entry =>
          entry.capability ===
          "unavailable",
      ).length,
  };
}
