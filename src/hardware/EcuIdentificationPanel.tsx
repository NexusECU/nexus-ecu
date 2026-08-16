import {
  BadgeCheck,
  CarFront,
  Cpu,
  FileKey2,
  Fingerprint,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  STANDARD_MODE09_REQUESTS,
  parseMode09Payloads,
} from "./ecuIdentificationService";

import "./ecu-identification.css";

type Props = {
  adapterDetected: boolean;
  linkConnected: boolean;
};

export function EcuIdentificationPanel({
  adapterDetected,
  linkConnected,
}: Props) {
  const [capturedText,setCapturedText] =
    useState("");

  const payloads =
    useMemo(
      () =>
        capturedText
          .split(/\r?\n/)
          .map(line =>
            line
              .trim()
              .replace(/[^0-9a-fA-F]/g, "")
          )
          .filter(line =>
            line.length >= 4 &&
            line.length % 2 === 0
          )
          .map(line => {
            const bytes: number[] = [];

            for (
              let index = 0;
              index < line.length;
              index += 2
            ) {
              bytes.push(
                Number.parseInt(
                  line.slice(index,index+2),
                  16,
                ),
              );
            }

            return bytes;
          }),
      [capturedText],
    );

  const identity =
    useMemo(
      () =>
        parseMode09Payloads(
          payloads,
        ),
      [payloads],
    );

  const ready =
    adapterDetected &&
    linkConnected;

  return (
    <section className="ecu-identification">
      <div className="ecu-identification-header">
        <div>
          <Fingerprint size={16}/>
          <div>
            <span className="eyebrow">
              ECU IDENTIFICATION
            </span>
            <h3>
              Vehicle / Calibration Identity
            </h3>
          </div>
        </div>

        <div className="ecu-identification-safe">
          <ShieldCheck size={13}/>
          READ-ONLY REQUEST PLAN
        </div>
      </div>

      <div className="ecu-identification-readiness">
        <Info
          label="ADAPTER"
          value={
            adapterDetected
              ? "DETECTED"
              : "NOT DETECTED"
          }
        />
        <Info
          label="LINK"
          value={
            linkConnected
              ? "CONNECTED"
              : "NONE"
          }
        />
        <Info
          label="IDENTIFICATION"
          value={
            identity.vin ||
            identity.calibrationIds.length ||
            identity.ecuNames.length
              ? "DATA OBSERVED"
              : "UNKNOWN"
          }
        />
      </div>

      <div className="ecu-identification-grid">
        <IdentityCard
          icon={<CarFront size={13}/>}
          label="VIN"
          value={identity.vin ?? "UNKNOWN"}
        />
        <IdentityCard
          icon={<FileKey2 size={13}/>}
          label="CALIBRATION ID"
          value={
            identity.calibrationIds.join(" · ") ||
            "UNKNOWN"
          }
        />
        <IdentityCard
          icon={<Cpu size={13}/>}
          label="ECU NAME"
          value={
            identity.ecuNames.join(" · ") ||
            "UNKNOWN"
          }
        />
        <IdentityCard
          icon={<BadgeCheck size={13}/>}
          label="CVN"
          value={
            identity.cvns.join(" · ") ||
            "UNKNOWN"
          }
        />
      </div>

      <div className="ecu-identification-plan">
        <div className="ecu-identification-title">
          <ScanSearch size={13}/>
          STANDARD MODE 09 READ PLAN
        </div>

        {STANDARD_MODE09_REQUESTS.map(
          request => (
            <div
              key={request.commandHex}
              className="ecu-identification-request"
            >
              <code>
                {request.commandHex}
              </code>
              <span>
                {request.label}
              </span>
              <strong>
                READ ONLY
              </strong>
            </div>
          ),
        )}
      </div>

      <div className="ecu-identification-capture">
        <div className="ecu-identification-title">
          CAPTURED MODE 09 RESPONSES
        </div>

        <textarea
          value={capturedText}
          placeholder={
            ready
              ? "Paste/capture response payloads here, e.g. 49 02 ... NEXUS will decode only received identification data."
              : "Connect a supported adapter first. You can still paste previously captured Mode 09 response payloads for offline decoding."
          }
          onChange={
            event =>
              setCapturedText(
                event.target.value,
              )
          }
        />

        <div className="ecu-identification-evidence">
          {identity.evidence.length
            ? identity.evidence.map(
                item => (
                  <span key={item}>
                    {item}
                  </span>
                ),
              )
            : (
              <span>
                No identifying response data decoded.
              </span>
            )}
        </div>
      </div>

      <div className="ecu-identification-note"> prepares and decodes standard OBD-II Service 09
        vehicle-information requests. Generic arbitrary CAN
        transmit, diagnostic-session changes, security access,
        memory reads and ECU programming remain unavailable.
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

function IdentityCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="ecu-identification-card">
      <div>
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}
