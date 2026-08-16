import {
  BadgeCheck,
  CheckCircle2,
  CircleHelp,
  Cpu,
  Fingerprint,
  Radio,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import {
  decodeLiveEcuIdentification,
} from "./liveEcuIdentificationService";

import "./live-identification-pipeline.css";

type Props = {
  frames:
    CanFrame[];
};

export function LiveIdentificationPipelinePanel({
  frames,
}: Props) {
  const decoded =
    useMemo(
      () =>
        decodeLiveEcuIdentification(
          frames,
        ),
      [
        frames,
      ],
    );

  const identity =
    decoded.identity;

  const detected =
    Boolean(
      identity.vin ||
      identity.calibrationIds.length ||
      identity.ecuNames.length ||
      identity.cvns.length,
    );

  return (
    <section className="live-id-pipeline">
      <div className="live-id-pipeline-header">
        <div>
          <Fingerprint
            size={16}
          />

          <div>
            <span className="eyebrow">
              REAL ECU IDENTIFICATION PIPELINE · V8.2
            </span>

            <h3>
              Passive ISO-TP / Mode 09 Decode
            </h3>
          </div>
        </div>

        <div
          className={`live-id-pipeline-state ${
            detected
              ? "detected"
              : "unknown"
          }`}
        >
          {detected ? (
            <CheckCircle2
              size={12}
            />
          ) : (
            <CircleHelp
              size={12}
            />
          )}

          {detected
            ? "IDENTITY DATA DETECTED"
            : "WAITING FOR RESPONSES"}
        </div>
      </div>

      <div className="live-id-pipeline-stats">
        <Info
          label="MODE 09 MESSAGES"
          value={
            String(
              decoded.mode09MessageCount,
            )
          }
        />

        <Info
          label="RESPONDERS"
          value={
            decoded.responderIds.length
              ? decoded.responderIds.join(
                  " · ",
                )
              : "NONE"
          }
        />

        <Info
          label="VIN"
          value={
            identity.vin ??
            "UNKNOWN"
          }
        />

        <Info
          label="CAL ID"
          value={
            identity.calibrationIds.length
              ? identity.calibrationIds.join(
                  " · ",
                )
              : "UNKNOWN"
          }
        />
      </div>

      <div className="live-id-pipeline-grid">
        <Identity
          icon={<Cpu size={12}/>}
          label="ECU NAME"
          value={
            identity.ecuNames.length
              ? identity.ecuNames.join(
                  " · ",
                )
              : "UNKNOWN"
          }
        />

        <Identity
          icon={<BadgeCheck size={12}/>}
          label="CVN"
          value={
            identity.cvns.length
              ? identity.cvns.join(
                  " · ",
                )
              : "UNKNOWN"
          }
        />

        <Identity
          icon={<Radio size={12}/>}
          label="SUPPORTED MODE 09 PIDS"
          value={
            identity.supportedMode09Pids.length
              ? identity.supportedMode09Pids
                  .map(
                    pid =>
                      `0x${pid
                        .toString(16)
                        .toUpperCase()
                        .padStart(
                          2,
                          "0",
                        )}`,
                  )
                  .join(
                    " · ",
                  )
              : "UNKNOWN"
          }
        />
      </div>

      <div className="live-id-pipeline-evidence">
        {decoded.evidence.length
          ? decoded.evidence.map(
              item => (
                <span
                  key={
                    item
                  }
                >
                  {item}
                </span>
              ),
            )
          : (
            <span>
              NEXUS has not passively observed a complete Mode
              09 ISO-TP response yet.
            </span>
          )}
      </div>

      <div className="live-id-pipeline-note">
        v8.2 decodes identification responses already present
        on the receive stream. It does not add arbitrary CAN
        transmit, security access, memory-read or programming
        commands.
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Identity({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="live-id-pipeline-card">
      <div>
        {icon}

        <span>
          {label}
        </span>
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}
