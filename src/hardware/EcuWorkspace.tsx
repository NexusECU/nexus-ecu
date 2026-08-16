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

export function EcuWorkspace({
  loadedRomImage,
  operatingMode,
  onOperatingModeChange,
}: Props) {
  return (
    <section className="nexus-separated-workspace">
      <div className="nexus-separated-workspace-heading">
        <span className="eyebrow">
          ECU
        </span>

        <h2>
          ECU Identification & Calibration Context
        </h2>

        <p>
          Identify the controller, inspect VIN and Calibration ID,
          match definitions, review ROM context and binding status.
        </p>
      </div>

      <HardwareManager
        forcedWorkspaceTab="identification"
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
