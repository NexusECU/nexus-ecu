import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Cpu,
  Database,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  buildEcuCapabilityMatchSummary,
} from "./ecuMatchService";

import "./ecu-identification-match.css";

type Props = {
  vin:
    string | null;

  calibrationIds:
    string[];

  ecuNames:
    string[];
};

export function EcuIdentificationMatchPanel({
  vin,
  calibrationIds,
  ecuNames,
}: Props) {
  const summary =
    useMemo(
      () =>
        buildEcuCapabilityMatchSummary(
          vin,
          calibrationIds,
          ecuNames,
        ),
      [
        vin,
        calibrationIds,
        ecuNames,
      ],
    );

  return (
    <section className="ecu-identification-match">
      <div className="ecu-identification-match-header">
        <div>
          <Database
            size={16}
          />

          <div>
            <span className="eyebrow">
              ECU IDENTIFICATION & CAPABILITY MATCHING
            </span>

            <h3>
              Definition Compatibility
            </h3>
          </div>
        </div>

        <div
          className={`ecu-identification-match-state ${
            summary.bestMatch?.confidence ??
            "none"
          }`}
        >
          {summary.bestMatch ? (
            <BadgeCheck
              size={12}
            />
          ) : (
            <CircleHelp
              size={12}
            />
          )}

          {summary.bestMatch
            ? `${summary.bestMatch.confidence.toUpperCase()} CONFIDENCE`
            : "NO MATCH"}
        </div>
      </div>

      <div className="ecu-identification-match-summary">
        <Info
          label="VIN"
          value={
            vin ??
            "UNKNOWN"
          }
        />

        <Info
          label="CALIBRATION ID"
          value={
            calibrationIds.length
              ? calibrationIds.join(
                  " · ",
                )
              : "UNKNOWN"
          }
        />

        <Info
          label="ECU NAME"
          value={
            ecuNames.length
              ? ecuNames.join(
                  " · ",
                )
              : "UNKNOWN"
          }
        />

        <Info
          label="BEST DEFINITION"
          value={
            summary.bestMatch?.definitionName ??
            "NONE"
          }
        />

        <Info
          label="ROM ID"
          value={
            summary.bestMatch?.romId ??
            "UNKNOWN"
          }
        />

        <Info
          label="MATCH SCORE"
          value={
            summary.bestMatch
              ? `${summary.bestMatch.score}/100`
              : "0/100"
          }
        />
      </div>

      <div className="ecu-identification-match-message">
        {summary.bestMatch ? (
          <CheckCircle2
            size={13}
          />
        ) : summary.identityReady ? (
          <CircleAlert
            size={13}
          />
        ) : (
          <CircleHelp
            size={13}
          />
        )}

        <span>
          {summary.compatibilityText}
        </span>
      </div>

      {summary.bestMatch && (
        <div className="ecu-identification-match-evidence">
          <div className="ecu-identification-match-title">
            <Cpu
              size={12}
            />

            MATCH EVIDENCE
          </div>

          {summary.bestMatch.evidence.map(
            item => (
              <div
                key={
                  item.label
                }
                className={
                  item.matched
                    ? "matched"
                    : ""
                }
              >
                {item.matched ? (
                  <CheckCircle2
                    size={11}
                  />
                ) : (
                  <CircleHelp
                    size={11}
                  />
                )}

                <strong>
                  {item.label}
                </strong>

                <span>
                  {item.detail}
                </span>
              </div>
            ),
          )}
        </div>
      )}

      <div className="ecu-identification-match-candidates">
        <div className="ecu-identification-match-title">
          TOP DEFINITION CANDIDATES
        </div>

        {summary.candidates
          .slice(
            0,
            5,
          )
          .map(
            candidate => (
              <div
                key={
                  candidate.definitionId
                }
                className={`candidate ${candidate.confidence}`}
              >
                <strong>
                  {candidate.definitionName}
                </strong>

                <span>
                  {candidate.romId}
                </span>

                <b>
                  {candidate.score}/100
                </b>
              </div>
            ),
          )}
      </div>

      <div className="ecu-identification-match-footer"> matches observed ECU identity against NEXUS
        calibration definitions. A match is advisory and does
        not bypass provider/session safety gates.
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
