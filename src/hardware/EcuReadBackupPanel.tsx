import {
  Archive,
  CheckCircle2,
  CircleAlert,
  Download,
  FileCheck2,
  HardDriveDownload,
  ShieldCheck,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  RomImageInfo,
} from "../rom/romTypes";

import {
  createBackupFromRomImage,
  exportBackup,
  verifyBackup,
} from "./ecuReadService";

import type {
  EcuBackupRecord,
  EcuReadLogEntry,
  EcuReadStage,
} from "./ecuReadTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import "./ecu-read-backup.css";

type Props = {
  providerId:
    TransportProviderId;
  adapterDetected:
    boolean;
  linkConnected:
    boolean;
  identitySummary:
    string;
  protocolSummary:
    string;
  loadedRomImage:
    RomImageInfo | null;
};

function stageLabel(
  stage: EcuReadStage,
): string {
  switch (stage) {
    case "idle":
      return "IDLE";
    case "checking-provider":
      return "CHECKING PROVIDER";
    case "checking-link":
      return "CHECKING LINK";
    case "identifying":
      return "IDENTIFICATION";
    case "reading":
      return "READING";
    case "verifying":
      return "VERIFYING";
    case "complete":
      return "COMPLETE";
    case "failed":
      return "FAILED";
  }
}

export function EcuReadBackupPanel({
  providerId,
  adapterDetected,
  linkConnected,
  identitySummary,
  protocolSummary,
  loadedRomImage,
}: Props) {
  const [stage,setStage] =
    useState<EcuReadStage>("idle");
  const [progress,setProgress] =
    useState(0);
  const [logs,setLogs] =
    useState<EcuReadLogEntry[]>([]);
  const [backups,setBackups] =
    useState<EcuBackupRecord[]>([]);

  const addLog = (
    level: EcuReadLogEntry["level"],
    message: string,
  ) => {
    setLogs(previous=>[
      ...previous,
      {
        id:
          `read-log-${Date.now()}-${previous.length}`,
        timestamp:
          new Date().toISOString(),
        level,
        message,
      },
    ]);
  };

  const runReadWorkflow =
    async () => {
      setLogs([]);
      setProgress(5);
      setStage("checking-provider");
      addLog(
        "info",
        `Provider selected: ${providerId}`,
      );

      if(!adapterDetected){
        setStage("failed");
        setProgress(0);
        addLog(
          "error",
          "No supported adapter detected.",
        );
        return;
      }

      setProgress(20);
      setStage("checking-link");

      if(!linkConnected){
        setStage("failed");
        setProgress(0);
        addLog(
          "error",
          "Adapter is detected but the hardware link is not connected.",
        );
        return;
      }

      addLog(
        "success",
        "Hardware link is connected.",
      );

      setProgress(35);
      setStage("identifying");
      addLog(
        "info",
        `Identity evidence: ${identitySummary}`,
      );
      addLog(
        "info",
        `Protocol evidence: ${protocolSummary}`,
      );

      if(!loadedRomImage){
        setStage("failed");
        setProgress(0);
        addLog(
          "warning",
          "No ROM image is currently available for backup. does not issue active ECU memory-read commands yet.",
        );
        return;
      }

      setProgress(55);
      setStage("reading");
      addLog(
        "info",
        "Creating read-only backup from the currently loaded ROM image.",
      );

      const backup =
        await createBackupFromRomImage(
          loadedRomImage,
          providerId,
          identitySummary,
          protocolSummary,
        );

      setProgress(85);
      setStage("verifying");

      const verified =
        await verifyBackup(
          backup,
        );

      const verifiedBackup = {
        ...backup,
        verified,
      };

      setBackups(previous=>[
        verifiedBackup,
        ...previous,
      ]);

      if(verified){
        addLog(
          "success",
          `Backup verified: ${verifiedBackup.sha256}`,
        );
        setProgress(100);
        setStage("complete");
      } else {
        addLog(
          "error",
          "Backup verification failed.",
        );
        setProgress(0);
        setStage("failed");
      }
    };

  return (
    <section className="ecu-read-backup">
      <div className="ecu-read-backup-header">
        <div>
          <HardDriveDownload size={16}/>
          <div>
            <span className="eyebrow">
              ECU READ & BACKUP
            </span>
            <h3>
              Read-Only Backup Workflow
            </h3>
          </div>
        </div>

        <div className="ecu-read-backup-safe">
          <ShieldCheck size={13}/>
          ECU WRITE / FLASH DISABLED
        </div>
      </div>

      <div className="ecu-read-backup-status">
        <Info label="STAGE" value={stageLabel(stage)}/>
        <Info label="PROVIDER" value={providerId.toUpperCase()}/>
        <Info label="ADAPTER" value={adapterDetected?"DETECTED":"NOT DETECTED"}/>
        <Info label="LINK" value={linkConnected?"CONNECTED":"NONE"}/>
        <Info label="BACKUPS" value={String(backups.length)}/>
      </div>

      <div className="ecu-read-progress">
        <div>
          <span style={{width:`${progress}%`}}/>
        </div>
        <strong>{progress}%</strong>
      </div>

      <div className="ecu-read-actions">
        <button
          type="button"
          disabled={
            stage!=="idle" &&
            stage!=="complete" &&
            stage!=="failed"
          }
          onClick={()=>void runReadWorkflow()}
        >
          <FileCheck2 size={13}/>
          RUN READ / BACKUP CHECK
        </button>
      </div>

      <div className="ecu-read-note"> verifies provider/link readiness and creates a
        verified backup from a ROM image already available to
        NEXUS. It still does not send active ECU memory-read,
        diagnostic-session, seed/key or ECU programming commands.
      </div>

      <div className="ecu-read-layout">
        <div className="ecu-read-log">
          <div className="ecu-read-section-title">
            READ LOG
          </div>

          {logs.length ? logs.map(entry=>(
            <div
              key={entry.id}
              className={entry.level}
            >
              {entry.level==="success"?
                <CheckCircle2 size={11}/>:
                entry.level==="error"?
                  <CircleAlert size={11}/>:
                  <Archive size={11}/>
              }
              <div>
                <strong>
                  {entry.level.toUpperCase()}
                </strong>
                <span>
                  {entry.message}
                </span>
              </div>
            </div>
          )):(
            <div className="ecu-read-empty">
              No read session has been run yet.
            </div>
          )}
        </div>

        <div className="ecu-backup-history">
          <div className="ecu-read-section-title">
            BACKUP HISTORY
          </div>

          {backups.length ? backups.map(backup=>(
            <div
              key={backup.id}
              className="ecu-backup-card"
            >
              <div>
                <strong>{backup.fileName}</strong>
                <span>
                  {backup.sizeBytes.toLocaleString()} bytes
                </span>
                <span>
                  SHA-256 {backup.sha256.slice(0,16)}…
                </span>
                <span>
                  {backup.verified?"VERIFIED":"NOT VERIFIED"}
                </span>
              </div>

              <button
                type="button"
                onClick={()=>exportBackup(backup)}
              >
                <Download size={12}/>
                EXPORT
              </button>
            </div>
          )):(
            <div className="ecu-read-empty">
              No backups created in this session.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
