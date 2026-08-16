import {
  useRef,
  useState,
} from "react";

import {
  createCalibration,
  createSnapshot,
  exportCalibration,
  importCalibration,
  type CalibrationSet,
  type CalibrationSnapshot,
} from "./calibrationManager";

import type { EcuMap } from "../maps/mapTypes";

interface CalibrationPanelProps {
  maps: {
    fuel: EcuMap;
    ignition: EcuMap;
    boost: EcuMap;
  };

  onLoadMaps: (
    maps: CalibrationSet["maps"],
  ) => void;

  onResetMaps: () => void;
}

export function CalibrationPanel({
  maps,
  onLoadMaps,
  onResetMaps,
}: CalibrationPanelProps) {
  const [name, setName] =
    useState("Street Calibration");

  const [description, setDescription] =
    useState(
      "Nexus ECU calibration",
    );

  const [calibration, setCalibration] =
    useState<CalibrationSet | null>(
      null,
    );

  const [snapshots, setSnapshots] =
    useState<
      CalibrationSnapshot[]
    >([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const saveCalibration = () => {
    const created =
      createCalibration(
        name,
        description,
        maps,
      );

    setCalibration(created);
  };

  const createNewSnapshot = () => {
    const snapshot =
      createSnapshot(
        `Snapshot ${
          snapshots.length + 1
        }`,
        maps,
      );

    setSnapshots(
      (previous) => [
        ...previous,
        snapshot,
      ],
    );
  };

  const downloadCalibration = () => {
    const current =
      calibration ??
      createCalibration(
        name,
        description,
        maps,
      );

    const data =
      exportCalibration(current);

    const blob =
      new Blob(
        [data],
        {
          type:
            "application/json",
        },
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href = url;

    anchor.download =
      `${current.name
        .replace(
          /[^a-z0-9]/gi,
          "-",
        )
        .toLowerCase()}.json`;

    anchor.click();

    URL.revokeObjectURL(url);
  };

  const loadFile = (
    file: File,
  ) => {
    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const imported =
          importCalibration(
            String(
              reader.result,
            ),
          );

        setCalibration(
          imported,
        );

        setName(
          imported.name,
        );

        setDescription(
          imported.description,
        );

        onLoadMaps(
          imported.maps,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid calibration file.";

        window.alert(message);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="calibration-panel">
      <div className="calibration-form">
        <div>
          <label>
            CALIBRATION NAME
          </label>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
          />
        </div>

        <div>
          <label>
            DESCRIPTION
          </label>

          <input
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
          />
        </div>
      </div>

      <div className="calibration-actions">
        <button
          onClick={
            saveCalibration
          }
        >
          SAVE CALIBRATION
        </button>

        <button
          onClick={
            createNewSnapshot
          }
        >
          CREATE SNAPSHOT
        </button>

        <button
          onClick={
            downloadCalibration
          }
        >
          EXPORT JSON
        </button>

        <button
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          IMPORT JSON
        </button>

        <button
          className="danger"
          onClick={onResetMaps}
        >
          RESET MAPS
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            if (file) {
              loadFile(file);
            }

            event.target.value = "";
          }}
        />
      </div>

      {calibration && (
        <div className="calibration-info">
          <div>
            <span>
              ACTIVE CALIBRATION
            </span>

            <strong>
              {calibration.name}
            </strong>
          </div>

          <div>
            <span>
              LAST UPDATED
            </span>

            <strong>
              {new Date(
                calibration.updatedAt,
              ).toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="snapshots">
          <span className="eyebrow">
            SNAPSHOTS
          </span>

          {snapshots.map(
            (snapshot) => (
              <div
                className="snapshot"
                key={snapshot.id}
              >
                <div>
                  <strong>
                    {snapshot.name}
                  </strong>

                  <span>
                    {new Date(
                      snapshot.createdAt,
                    ).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() =>
                    onLoadMaps(
                      snapshot.maps,
                    )
                  }
                >
                  LOAD
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}