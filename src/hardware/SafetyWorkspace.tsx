import {
  HardwareManager,
} from "./HardwareManager";

import type {
  OperatingMode,
} from "./hardwareTypes";

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

export function SafetyWorkspace({
  loadedRomImage,
  operatingMode,
  onOperatingModeChange,
}: Props) {
  return (
    <section className="nexus-separated-workspace">
      <div className="nexus-separated-workspace-heading">
        <span className="eyebrow">
          SAFETY
        </span>

        <h2>
          ECU Safety & Capability Gates
        </h2>

        <p>
          Review compatibility, capability availability,
          session readiness and safety blockers separately
          from hardware setup and diagnostics.
        </p>
      </div>

      <HardwareManager
        forcedWorkspaceTab="capabilities"
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
