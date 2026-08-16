import {
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Gauge,
  Lightbulb,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  TransportProviderId,
} from "./transportTypes";

import {
  getAdapterProfile,
} from "./adapterProfiles";

import {
  buildEcuCapabilityMatrix,
} from "./ecuCapabilityService";

import {
  buildEcuCapabilityMatchSummary,
} from "./ecuMatchService";

import {
  buildEcuCompatibilitySummary,
} from "./ecuCompatibilityService";

import "./ecu-compatibility-intelligence.css";

type Props = {
  providerId:
    TransportProviderId;

  adapterReady:
    boolean;

  linkReady:
    boolean;

  diagnosticResponderReady:
    boolean;

  vin:
    string | null;

  calibrationIds:
    string[];

  ecuNames:
    string[];

  romImageLoaded:
    boolean;
};

export function EcuCompatibilityIntelligencePanel({
  providerId,
  adapterReady,
  linkReady,
  diagnosticResponderReady,
  vin,
  calibrationIds,
  ecuNames,
  romImageLoaded,
}: Props) {
  const profile =
    getAdapterProfile(
      providerId,
    );

  const matchSummary =
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

  const identityReady =
    matchSummary.identityReady;

  const capabilityMatrix =
    useMemo(
      () =>
        buildEcuCapabilityMatrix(
          profile,
          adapterReady,
          linkReady,
          diagnosticResponderReady,
          identityReady,
          romImageLoaded,
        ),
      [
        profile,
        adapterReady,
        linkReady,
        diagnosticResponderReady,
        identityReady,
        romImageLoaded,
      ],
    );

  const summary =
    useMemo(
      () =>
        buildEcuCompatibilitySummary(
          identityReady,
          matchSummary.bestMatch,
          capabilityMatrix,
          linkReady,
          diagnosticResponderReady,
          romImageLoaded,
        ),
      [
        identityReady,
        matchSummary.bestMatch,
        capabilityMatrix,
        linkReady,
        diagnosticResponderReady,
        romImageLoaded,
      ],
    );

  return (
    <section className="ecu-compatibility-intelligence">
      <div className="ecu-compatibility-intelligence-header">
        <div>
          <BrainCircuit
            size={16}
          />

          <div>
            <span className="eyebrow">
              VEHICLE / ECU COMPATIBILITY INTELLIGENCE
            </span>

            <h3>
              Unified Compatibility Verdict
            </h3>
          </div>
        </div>

        <div
          className={`ecu-compatibility-verdict ${summary.verdict}`}
        >
          {summary.verdict ===
          "supported" ? (
            <CheckCircle2
              size={12}
            />
          ) : summary.verdict ===
              "unknown" ? (
            <CircleHelp
              size={12}
            />
          ) : (
            <CircleAlert
              size={12}
            />
          )}

          {summary.verdict.toUpperCase()}
        </div>
      </div>

      <div className="ecu-compatibility-score">
        <div>
          <Gauge
            size={14}
          />

          <span>
            COMPATIBILITY SCORE
          </span>

          <strong>
            {summary.score}/100
          </strong>
        </div>

        <div>
          <span>
            CONFIDENCE
          </span>

          <strong>
            {summary.confidence}%
          </strong>
        </div>

        <div>
          <span>
            BEST DEFINITION
          </span>

          <strong>
            {matchSummary.bestMatch?.definitionName ??
              "NONE"}
          </strong>
        </div>

        <div>
          <span>
            AVAILABLE OPS
          </span>

          <strong>
            {capabilityMatrix.availableCount}
          </strong>
        </div>
      </div>

      <div className="ecu-compatibility-summary-text">
        {summary.summaryText}
      </div>

      <div className="ecu-compatibility-factors">
        <div className="ecu-compatibility-section-title">
          COMPATIBILITY FACTORS
        </div>

        {summary.factors.map(
          factor => (
            <div
              key={
                factor.id
              }
              className={
                factor.passed
                  ? "passed"
                  : "failed"
              }
            >
              <div>
                {factor.passed ? (
                  <CheckCircle2
                    size={11}
                  />
                ) : (
                  <CircleAlert
                    size={11}
                  />
                )}
              </div>

              <strong>
                {factor.label}
              </strong>

              <span>
                {factor.detail}
              </span>

              <b>
                {factor.passed
                  ? `+${factor.weight}`
                  : "0"}
              </b>
            </div>
          ),
        )}
      </div>

      <div className="ecu-compatibility-recommendations">
        <div className="ecu-compatibility-section-title">
          <Lightbulb
            size={12}
          />

          RECOMMENDED NEXT ACTIONS
        </div>

        {summary.recommendations.length ? (
          summary.recommendations.map(
            (
              recommendation,
              index,
            ) => (
              <div
                key={
                  `${recommendation.title}-${index}`
                }
                className={
                  recommendation.priority
                }
              >
                <b>
                  {recommendation.priority.toUpperCase()}
                </b>

                <strong>
                  {recommendation.title}
                </strong>

                <span>
                  {recommendation.detail}
                </span>
              </div>
            ),
          )
        ) : (
          <div className="ecu-compatibility-empty">
            No immediate compatibility actions are required.
          </div>
        )}
      </div>

      <div className="ecu-compatibility-footer"> combines identity, definition matching, transport,
        responder evidence, capability state, and ROM context.
        The verdict is advisory and never overrides operation
        safety gates.
      </div>
    </section>
  );
}
