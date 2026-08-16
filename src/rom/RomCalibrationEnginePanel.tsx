import {
  Binary,
  CircleAlert,
  Cpu,
  Database,
  RefreshCw,
} from "lucide-react";

import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  EcuMap,
} from "../maps/mapTypes";

import {
  decodeTableFromRom,
  describeBinaryLayout,
  encodeTableToRom,
} from "./romCalibrationEngine";

import type {
  RomImageInfo,
} from "./romTypes";

import "./rom-calibration-engine.css";

type Props = {
  image:
    RomImageInfo | null;

  definitions:
    CalibrationDefinition[];

  activeDefinitionId:
    string;

  activeMap:
    EcuMap;

  onMapDecoded: (
    map:
      EcuMap,
  ) => void;

  onRomBytesChange: (
    bytes:
      Uint8Array,
  ) => void;
};

export function RomCalibrationEnginePanel({
  image,
  definitions,
  activeDefinitionId,
  activeMap,
  onMapDecoded,
  onRomBytesChange,
}: Props) {
  const definition =
    definitions.find(
      (item) =>
        item.id ===
        activeDefinitionId,
    ) ??
    null;

  const tableDefinition =
    definition?.map &&
    definition.binary
      ? definition
      : null;

  const decodeActive =
    () => {
      if (
        !image ||
        !tableDefinition
      ) {
        return;
      }

      onMapDecoded(
        decodeTableFromRom(
          image.bytes,
          tableDefinition,
        ),
      );
    };

  const encodeActive =
    () => {
      if (
        !image ||
        !tableDefinition
      ) {
        return;
      }

      onRomBytesChange(
        encodeTableToRom(
          image.bytes,
          tableDefinition,
          activeMap,
        ),
      );
    };

  return (
    <section className="rom-calibration-engine">
      <div className="rom-calibration-engine-header">
        <div>
          <Cpu
            size={15}
          />

          <div>
            <span className="eyebrow">
              REAL ROM CALIBRATION ENGINE
            </span>

            <h3>
              Binary-backed Calibration
            </h3>
          </div>
        </div>

        <strong>
          ROM BYTES → DECODE → EDIT → ENCODE
        </strong>
      </div>

      {!image ? (
        <div className="rom-calibration-engine-empty">
          <Database
            size={18}
          />

          Load a ROM image first.
        </div>
      ) : !tableDefinition ? (
        <div className="rom-calibration-engine-empty">
          <CircleAlert
            size={18}
          />

          Select a table definition that contains a binary
          layout.
        </div>
      ) : (
        <>
          <div className="rom-calibration-engine-meta">
            <div>
              <span>
                TABLE
              </span>

              <strong>
                {tableDefinition.name}
              </strong>
            </div>

            <div>
              <span>
                BINARY LAYOUT
              </span>

              <strong>
                {describeBinaryLayout(
                  tableDefinition,
                )}
              </strong>
            </div>

            <div>
              <span>
                ROM
              </span>

              <strong>
                {image.fileName}
              </strong>
            </div>
          </div>

          <div className="rom-calibration-engine-actions">
            <button
              type="button"
              onClick={
                decodeActive
              }
            >
              <RefreshCw
                size={13}
              />

              DECODE TABLE FROM ROM
            </button>

            <button
              type="button"
              className="primary"
              onClick={
                encodeActive
              }
            >
              <Binary
                size={13}
              />

              WRITE TABLE TO ROM COPY
            </button>
          </div>

          <div className="rom-calibration-engine-note">
            This operates only on the loaded offline ROM
            buffer. It does not communicate with or program
            a vehicle ECU.
          </div>
        </>
      )}
    </section>
  );
}
