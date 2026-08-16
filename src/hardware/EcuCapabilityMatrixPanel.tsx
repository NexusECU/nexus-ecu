import {
  Ban,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Grid3X3,
  LockKeyhole,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  getAdapterProfile,
} from "./adapterProfiles";

import {
  buildEcuCapabilityMatrix,
} from "./ecuCapabilityService";

import type {
  EcuCapabilityState,
} from "./ecuCapabilityTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import "./ecu-capability-matrix.css";

type Props = {
  providerId:
    TransportProviderId;

  adapterReady:
    boolean;

  linkReady:
    boolean;

  diagnosticResponderReady:
    boolean;

  identityReady:
    boolean;

  romImageLoaded:
    boolean;
};

export function EcuCapabilityMatrixPanel({
  providerId,
  adapterReady,
  linkReady,
  diagnosticResponderReady,
  identityReady,
  romImageLoaded,
}: Props) {
  const profile =
    getAdapterProfile(
      providerId,
    );

  const matrix =
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

  return (
    <section className="ecu-capability-matrix">
      <div className="ecu-capability-matrix-header">
        <div>
          <Grid3X3
            size={16}
          />

          <div>
            <span className="eyebrow">
              ECU READINESS & CAPABILITY MATRIX · V7.9
            </span>

            <h3>
              Operation Availability
            </h3>
          </div>
        </div>

        <strong>
          {profile?.displayName ??
            providerId.toUpperCase()}
        </strong>
      </div>

      <div className="ecu-capability-stats">
        <Stat
          label="AVAILABLE"
          value={
            matrix.availableCount
          }
        />

        <Stat
          label="BLOCKED"
          value={
            matrix.blockedCount
          }
        />

        <Stat
          label="BRIDGE"
          value={
            matrix.bridgeRequiredCount
          }
        />

        <Stat
          label="NOT IMPLEMENTED"
          value={
            matrix.notImplementedCount
          }
        />

        <Stat
          label="UNSUPPORTED"
          value={
            matrix.unsupportedCount
          }
        />
      </div>

      <div className="ecu-capability-table">
        <div className="ecu-capability-row header">
          <span>
            OPERATION
          </span>

          <span>
            STATE
          </span>

          <span>
            REASON
          </span>
        </div>

        {matrix.entries.map(
          capability => (
            <div
              key={
                capability.key
              }
              className={`ecu-capability-row ${capability.state}`}
            >
              <strong>
                {capability.label}
              </strong>

              <State
                state={
                  capability.state
                }
              />

              <span>
                {capability.reason}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="ecu-capability-footer">
        <LockKeyhole
          size={12}
        />

        This matrix is the authoritative v7.9 operation gate.
        ECU write/flash and recovery remain unavailable until a
        later explicitly supported release.
      </div>
    </section>
  );
}

function State({
  state,
}: {
  state:
    EcuCapabilityState;
}) {
  return (
    <div className={`ecu-capability-state ${state}`}>
      {state ===
      "available" ? (
        <CheckCircle2
          size={11}
        />
      ) : state ===
        "blocked" ? (
        <LockKeyhole
          size={11}
        />
      ) : state ===
        "bridge-required" ? (
        <CircleAlert
          size={11}
        />
      ) : state ===
        "unsupported" ? (
        <Ban
          size={11}
        />
      ) : (
        <CircleHelp
          size={11}
        />
      )}

      {state
        .replace(
          "-",
          " ",
        )
        .toUpperCase()}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
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
