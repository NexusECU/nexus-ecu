import type {
  ComponentProps,
} from "react";

import {
  HardwareManager,
} from "./HardwareManager";

type HardwareManagerProps =
  ComponentProps<
    typeof HardwareManager
  >;

type OperatingMode =
  HardwareManagerProps["operatingMode"];

type Props = {
  loadedRomImage?:
    import("../rom/romTypes").RomImageInfo | null;

  operatingMode:
    OperatingMode;

  onOperatingModeChange: (
    mode:
      OperatingMode,
  ) => void;
};

export function DiagnosticsWorkspace({
  loadedRomImage,
  operatingMode,
  onOperatingModeChange,
}: Props) {
  return (
    <section className="nexus-separated-workspace">
      <div className="nexus-separated-workspace-heading">
        <span className="eyebrow">
          DIAGNOSTICS
        </span>

        <h2>
          Diagnostics & Recovery
        </h2>

        <p>
          Review protocol/channel status, hardware readiness,
          diagnostic events, recovery actions and ECU health.
        </p>
      </div>

      <HardwareManager
        forcedWorkspaceTab="diagnostics"
        loadedRomImage={
          loadedRomImage
        }
        operatingMode={
          operatingMode
        }
        onOperatingModeChange={
          onOperatingModeChange
        }
      />
    </section>
  );
}
