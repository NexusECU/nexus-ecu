import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  DatabaseBackup,
  FileCheck2,
  HardDriveDownload,
  History,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

import type {
  EcuMap,
} from "../maps/mapTypes";

import "./flash-manager.css";

type FlashOperation =
  | "idle"
  | "reading"
  | "writing"
  | "verifying"
  | "recovering"
  | "complete"
  | "failed";

type FlashBackup = {
  id: string;

  name: string;

  createdAt: string;

  checksum: string;

  maps: CalibrationSet["maps"];
};

type FlashHistoryItem = {
  id: string;

  time: string;

  action: string;

  result:
    | "SUCCESS"
    | "FAILED"
    | "BACKUP";

  checksum: string;
};

type FlashManagerProps = {
  maps: CalibrationSet["maps"];

  onLoadMaps: (
    maps: CalibrationSet["maps"],
  ) => void;
};

function cloneMap(
  map: EcuMap,
): EcuMap {
  return {
    ...map,

    xAxis: {
      ...map.xAxis,
      values: [
        ...map.xAxis.values,
      ],
    },

    yAxis: {
      ...map.yAxis,
      values: [
        ...map.yAxis.values,
      ],
    },

    values:
      map.values.map(
        (row) => [
          ...row,
        ],
      ),
  };
}

function cloneMaps(
  maps: CalibrationSet["maps"],
): CalibrationSet["maps"] {
  return {
    fuel:
      cloneMap(
        maps.fuel,
      ),

    ignition:
      cloneMap(
        maps.ignition,
      ),

    boost:
      cloneMap(
        maps.boost,
      ),
  };
}

function checksumMaps(
  maps: CalibrationSet["maps"],
): string {
  const payload =
    JSON.stringify({
      fuel:
        maps.fuel.values,
      ignition:
        maps.ignition.values,
      boost:
        maps.boost.values,
    });

  let hash =
    2166136261;

  for (
    let index = 0;
    index <
    payload.length;
    index++
  ) {
    hash ^=
      payload.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return (
    (hash >>> 0)
      .toString(16)
      .toUpperCase()
      .padStart(
        8,
        "0",
      )
  );
}

function countCells(
  maps: CalibrationSet["maps"],
): number {
  return (
    maps.fuel.values
      .flat().length +
    maps.ignition.values
      .flat().length +
    maps.boost.values
      .flat().length
  );
}

export function FlashManager({
  maps,
  onLoadMaps,
}: FlashManagerProps) {
  const [
    operation,
    setOperation,
  ] = useState<FlashOperation>(
    "idle",
  );

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    "ECU READY",
  );

  const [
    ecuSnapshot,
    setEcuSnapshot,
  ] = useState<
    CalibrationSet["maps"] | null
  >(null);

  const [
    backups,
    setBackups,
  ] = useState<
    FlashBackup[]
  >([]);

  const [
    history,
    setHistory,
  ] = useState<
    FlashHistoryItem[]
  >([]);

  const [
    simulateFailure,
    setSimulateFailure,
  ] = useState(false);

  const timerRef =
    useRef<number | null>(
      null,
    );

  const currentChecksum =
    useMemo(
      () =>
        checksumMaps(
          maps,
        ),
      [maps],
    );

  const ecuChecksum =
    ecuSnapshot
      ? checksumMaps(
          ecuSnapshot,
        )
      : "--------";

  const busy =
    operation ===
      "reading" ||
    operation ===
      "writing" ||
    operation ===
      "verifying" ||
    operation ===
      "recovering";

  const calibrationMatches =
    ecuSnapshot
      ? currentChecksum ===
        ecuChecksum
      : false;

  const addHistory = (
    action: string,
    result:
      | "SUCCESS"
      | "FAILED"
      | "BACKUP",
    checksum: string,
  ) => {
    setHistory(
      (previous) => [
        {
          id:
            `${Date.now()}-${Math.random()}`,

          time:
            new Date().toLocaleTimeString(),

          action,

          result,

          checksum,
        },

        ...previous,
      ].slice(
        0,
        20,
      ),
    );
  };

  const runOperation = (
    type:
      | "reading"
      | "writing"
      | "verifying"
      | "recovering",
    successMessage: string,
    onSuccess: () => void,
  ) => {
    if (busy) {
      return;
    }

    if (
      timerRef.current !==
      null
    ) {
      window.clearInterval(
        timerRef.current,
      );
    }

    setOperation(
      type,
    );

    setProgress(0);

    setStatusMessage(
      type === "reading"
        ? "READING ECU MEMORY"
        : type === "writing"
          ? "WRITING CALIBRATION"
          : type === "verifying"
            ? "VERIFYING CHECKSUM"
            : "RECOVERING ECU",
    );

    let value = 0;

    timerRef.current =
      window.setInterval(
        () => {
          value +=
            type ===
            "writing"
              ? 4
              : 8;

          const next =
            Math.min(
              100,
              value,
            );

          setProgress(
            next,
          );

          if (
            next < 100
          ) {
            return;
          }

          if (
            timerRef.current !==
            null
          ) {
            window.clearInterval(
              timerRef.current,
            );

            timerRef.current =
              null;
          }

          if (
            type ===
              "writing" &&
            simulateFailure
          ) {
            setOperation(
              "failed",
            );

            setStatusMessage(
              "FLASH FAILED — RECOVERY REQUIRED",
            );

            addHistory(
              "WRITE ECU",
              "FAILED",
              currentChecksum,
            );

            return;
          }

          onSuccess();

          setOperation(
            "complete",
          );

          setStatusMessage(
            successMessage,
          );
        },
        90,
      );
  };

  const readEcu =
    () => {
      runOperation(
        "reading",
        "ECU READ COMPLETE",
        () => {
          const snapshot =
            cloneMaps(
              maps,
            );

          setEcuSnapshot(
            snapshot,
          );

          const checksum =
            checksumMaps(
              snapshot,
            );

          addHistory(
            "READ ECU",
            "SUCCESS",
            checksum,
          );
        },
      );
    };

  const writeEcu =
    () => {
      runOperation(
        "writing",
        "FLASH COMPLETE — ECU VERIFIED",
        () => {
          const snapshot =
            cloneMaps(
              maps,
            );

          setEcuSnapshot(
            snapshot,
          );

          const checksum =
            checksumMaps(
              snapshot,
            );

          addHistory(
            "WRITE ECU",
            "SUCCESS",
            checksum,
          );
        },
      );
    };

  const verifyEcu =
    () => {
      runOperation(
        "verifying",
        ecuSnapshot
          ? calibrationMatches
            ? "VERIFY PASSED"
            : "VERIFY COMPLETE — CALIBRATION DIFFERS"
          : "VERIFY COMPLETE — NO ECU IMAGE",
        () => {
          addHistory(
            "VERIFY",
            ecuSnapshot &&
              calibrationMatches
              ? "SUCCESS"
              : "FAILED",
            currentChecksum,
          );
        },
      );
    };

  const recoverEcu =
    () => {
      runOperation(
        "recovering",
        "ECU RECOVERY COMPLETE",
        () => {
          const source =
            backups[0]?.maps ??
            ecuSnapshot;

          if (source) {
            const restored =
              cloneMaps(
                source,
              );

            onLoadMaps(
              restored,
            );

            setEcuSnapshot(
              cloneMaps(
                restored,
              ),
            );

            addHistory(
              "RECOVERY",
              "SUCCESS",
              checksumMaps(
                restored,
              ),
            );
          } else {
            addHistory(
              "RECOVERY",
              "SUCCESS",
              currentChecksum,
            );
          }
        },
      );
    };

  const createBackup =
    () => {
      const snapshot =
        cloneMaps(
          ecuSnapshot ??
            maps,
        );

      const checksum =
        checksumMaps(
          snapshot,
        );

      const backup: FlashBackup = {
        id:
          `${Date.now()}`,

        name:
          `ECU Backup ${backups.length + 1}`,

        createdAt:
          new Date().toLocaleString(),

        checksum,

        maps:
          snapshot,
      };

      setBackups(
        (previous) => [
          backup,
          ...previous,
        ].slice(
          0,
          8,
        ),
      );

      addHistory(
        "CREATE BACKUP",
        "BACKUP",
        checksum,
      );

      setStatusMessage(
        "BACKUP CREATED",
      );
    };

  const restoreBackup = (
    backup: FlashBackup,
  ) => {
    if (busy) {
      return;
    }

    const restored =
      cloneMaps(
        backup.maps,
      );

    onLoadMaps(
      restored,
    );

    setStatusMessage(
      `RESTORED ${backup.name.toUpperCase()}`,
    );

    addHistory(
      "RESTORE BACKUP",
      "SUCCESS",
      backup.checksum,
    );
  };

  return (
    <section className="flash-manager">
      <div className="flash-header">
        <div>
          <span className="eyebrow">
            ECU FLASHING / V1.4
          </span>

          <h2>
            Flash & Calibration Manager
          </h2>

          <p className="profile-description">
            Simulated ECU read, write, verification,
            checksum, backup and recovery workflow.
          </p>
        </div>

        <div
          className={`flash-state ${operation}`}
        >
          <Cpu
            size={15}
          />

          {statusMessage}
        </div>
      </div>

      <div className="flash-ecu-card">
        <div>
          <span>
            ECU TARGET
          </span>

          <strong>
            NEXUS SIM ECU
          </strong>
        </div>

        <div>
          <span>
            FIRMWARE
          </span>

          <strong>
            NX-1.4.0
          </strong>
        </div>

        <div>
          <span>
            CALIBRATION
          </span>

          <strong>
            {currentChecksum}
          </strong>
        </div>

        <div>
          <span>
            ECU IMAGE
          </span>

          <strong>
            {ecuChecksum}
          </strong>
        </div>

        <div>
          <span>
            MAP CELLS
          </span>

          <strong>
            {countCells(
              maps,
            )}
          </strong>
        </div>

        <div>
          <span>
            VERIFY
          </span>

          <strong>
            {!ecuSnapshot
              ? "NOT READ"
              : calibrationMatches
                ? "MATCH"
                : "MODIFIED"}
          </strong>
        </div>
      </div>

      <div className="flash-toolbar">
        <button
          type="button"
          disabled={busy}
          onClick={readEcu}
        >
          <HardDriveDownload
            size={15}
          />

          READ ECU
        </button>

        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={writeEcu}
        >
          <UploadCloud
            size={15}
          />

          WRITE ECU
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={verifyEcu}
        >
          <FileCheck2
            size={15}
          />

          VERIFY
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={createBackup}
        >
          <DatabaseBackup
            size={15}
          />

          BACKUP
        </button>

        <button
          type="button"
          className={
            operation ===
            "failed"
              ? "recovery"
              : ""
          }
          disabled={
            busy
          }
          onClick={
            recoverEcu
          }
        >
          <ShieldCheck
            size={15}
          />

          RECOVERY
        </button>
      </div>

      <div className="flash-progress-area">
        <div className="flash-progress-header">
          <span>
            FLASH PROGRESS
          </span>

          <strong>
            {progress}%
          </strong>
        </div>

        <div className="flash-progress-track">
          <div
            className="flash-progress-fill"
            style={{
              width:
                `${progress}%`,
            }}
          />
        </div>

        <div className="flash-progress-footer">
          <span>
            {busy
              ? "DO NOT INTERRUPT ECU POWER"
              : "ECU CONNECTION STABLE"}
          </span>

          <span>
            CHECKSUM:
            {" "}
            {currentChecksum}
          </span>
        </div>
      </div>

      <div className="flash-warning-row">
        <label>
          <input
            type="checkbox"
            checked={
              simulateFailure
            }
            disabled={busy}
            onChange={(event) =>
              setSimulateFailure(
                event.target.checked,
              )
            }
          />

          SIMULATE NEXT WRITE FAILURE
        </label>

        {operation ===
          "failed" && (
          <div className="flash-failure">
            <AlertTriangle
              size={15}
            />

            FLASH INTERRUPTED. USE RECOVERY.
          </div>
        )}
      </div>

      <div className="flash-columns">
        <div className="flash-subpanel">
          <div className="flash-subpanel-header">
            <div>
              <span className="eyebrow">
                CALIBRATION BACKUPS
              </span>

              <h3>
                Restore Points
              </h3>
            </div>

            <DatabaseBackup
              size={18}
            />
          </div>

          {backups.length ===
          0 ? (
            <div className="flash-empty">
              No ECU backups created yet.
            </div>
          ) : (
            <div className="flash-list">
              {backups.map(
                (backup) => (
                  <div
                    key={
                      backup.id
                    }
                    className="flash-list-item"
                  >
                    <div>
                      <strong>
                        {backup.name}
                      </strong>

                      <span>
                        {backup.createdAt}
                        {" · "}
                        {backup.checksum}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        restoreBackup(
                          backup,
                        )
                      }
                    >
                      <RotateCcw
                        size={13}
                      />

                      RESTORE
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="flash-subpanel">
          <div className="flash-subpanel-header">
            <div>
              <span className="eyebrow">
                FLASH HISTORY
              </span>

              <h3>
                Programming Log
              </h3>
            </div>

            <History
              size={18}
            />
          </div>

          {history.length ===
          0 ? (
            <div className="flash-empty">
              No flash operations recorded yet.
            </div>
          ) : (
            <div className="flash-list">
              {history.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="flash-list-item history"
                  >
                    <div>
                      <strong>
                        {item.action}
                      </strong>

                      <span>
                        {item.time}
                        {" · "}
                        {item.checksum}
                      </span>
                    </div>

                    <span
                      className={`flash-result ${item.result.toLowerCase()}`}
                    >
                      {item.result ===
                      "SUCCESS" && (
                        <CheckCircle2
                          size={12}
                        />
                      )}

                      {item.result}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
