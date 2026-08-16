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

export function HardwareOverviewWorkspace({
  loadedRomImage,
  operatingMode,
  onOperatingModeChange,
}: Props) {
  return (
    <section className="nexus-separated-workspace">
      <div className="nexus-separated-workspace-heading">
        <span className="eyebrow">
          HARDWARE
        </span>

        <h2>
          Adapter & Vehicle Interface
        </h2>

        <p>
          Configure providers, COM/J2534 interfaces,
          connection state, CAN monitoring and hardware readiness.
        </p>
      </div>

      <HardwareManager
        forcedWorkspaceTab="overview"
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
