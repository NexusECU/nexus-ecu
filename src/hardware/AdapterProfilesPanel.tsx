import {
  Cable,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Cpu,
  Layers3,
  PlugZap,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  ADAPTER_PROFILES,
} from "./adapterProfiles";

import type {
  AdapterSupportState,
} from "./adapterProfileTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import "./adapter-profiles.css";

type Props = {
  activeProvider:
    TransportProviderId;

  onSelectProvider: (
    provider:
      TransportProviderId,
  ) => void;
};

function stateLabel(
  state:
    AdapterSupportState,
): string {
  switch (state) {
    case "supported":
      return "SUPPORTED";

    case "bridge-required":
      return "BRIDGE REQUIRED";

    case "platform-specific":
      return "PLATFORM SPECIFIC";

    case "planned":
      return "PLANNED";

    case "unavailable":
      return "UNAVAILABLE";
  }
}

export function AdapterProfilesPanel({
  activeProvider,
  onSelectProvider,
}: Props) {
  const [
    query,
    setQuery,
  ] = useState("");

  const filtered =
    useMemo(
      () => {
        const needle =
          query
            .trim()
            .toLowerCase();

        if (!needle) {
          return ADAPTER_PROFILES;
        }

        return ADAPTER_PROFILES.filter(
          profile =>
            `${profile.displayName} ${profile.family} ${profile.protocols.join(" ")} ${profile.platforms.join(" ")}`
              .toLowerCase()
              .includes(
                needle,
              ),
        );
      },
      [
        query,
      ],
    );

  return (
    <section className="adapter-profiles">
      <div className="adapter-profiles-header">
        <div>
          <PlugZap
            size={16}
          />

          <div>
            <span className="eyebrow">
              SUPPORTED ADAPTER PROFILES · V7.5
            </span>

            <h3>
              Interface Compatibility
            </h3>
          </div>
        </div>

        <strong>
          PROVIDER-SPECIFIC CAPABILITIES
        </strong>
      </div>

      <div className="adapter-profiles-search">
        <input
          value={
            query
          }
          placeholder="Search adapter / protocol / platform…"
          onChange={
            event =>
              setQuery(
                event.target.value,
              )
          }
        />
      </div>

      <div className="adapter-profiles-grid">
        {filtered.map(
          profile => {
            const active =
              profile.providerId ===
              activeProvider;

            return (
              <button
                type="button"
                key={
                  profile.providerId
                }
                className={`adapter-profile-card ${
                  active
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  onSelectProvider(
                    profile.providerId,
                  )
                }
              >
                <div className="adapter-profile-card-top">
                  <div>
                    <Cable
                      size={13}
                    />

                    <strong>
                      {profile.displayName}
                    </strong>
                  </div>

                  <State
                    value={
                      profile.supportState
                    }
                  />
                </div>

                <span className="adapter-profile-family">
                  {profile.family}
                </span>

                <div className="adapter-profile-lines">
                  <Line
                    label="PLATFORM"
                    value={
                      profile.platforms.join(
                        " · ",
                      )
                    }
                  />

                  <Line
                    label="DRIVER"
                    value={
                      profile.driverRequirement
                    }
                  />

                  <Line
                    label="BRIDGE"
                    value={
                      profile.bridgeRequirement
                    }
                  />

                  <Line
                    label="PROTOCOLS"
                    value={
                      profile.protocols.join(
                        " · ",
                      )
                    }
                  />
                </div>

                <div className="adapter-profile-capabilities">
                  <Capability
                    label="PASSIVE RX"
                    enabled={
                      profile.passiveReceive
                    }
                  />

                  <Capability
                    label="STANDARD DIAG"
                    enabled={
                      profile.standardDiagnostics
                    }
                  />

                  <Capability
                    label="ROM READ"
                    enabled={
                      profile.romRead
                    }
                  />

                  <Capability
                    label="ROM WRITE"
                    enabled={
                      profile.romWrite
                    }
                  />
                </div>

                {profile.recommendedBaudRates.length >
                0 && (
                  <div className="adapter-profile-baud">
                    <Cpu
                      size={11}
                    />

                    {profile.recommendedBaudRates
                      .map(
                        rate =>
                          rate >= 1000
                            ? `${Math.round(
                                rate /
                                1000,
                              )}K`
                            : String(
                                rate,
                              ),
                      )
                      .join(
                        " · ",
                      )}
                  </div>
                )}

                <div className="adapter-profile-notes">
                  {profile.notes.map(
                    note => (
                      <span
                        key={
                          note
                        }
                      >
                        {note}
                      </span>
                    ),
                  )}
                </div>
              </button>
            );
          },
        )}
      </div>
    </section>
  );
}

function State({
  value,
}: {
  value:
    AdapterSupportState;
}) {
  return (
    <div className={`adapter-profile-state ${value}`}>
      {value === "supported" ? (
        <CheckCircle2
          size={11}
        />
      ) : value === "bridge-required" ? (
        <CircleAlert
          size={11}
        />
      ) : (
        <CircleHelp
          size={11}
        />
      )}

      {stateLabel(
        value,
      )}
    </div>
  );
}

function Line({
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

function Capability({
  label,
  enabled,
}: {
  label:
    string;

  enabled:
    boolean;
}) {
  return (
    <div
      className={
        enabled
          ? "enabled"
          : ""
      }
    >
      <Layers3
        size={10}
      />

      {label}

      <strong>
        {enabled
          ? "YES"
          : "NO"}
      </strong>
    </div>
  );
}
