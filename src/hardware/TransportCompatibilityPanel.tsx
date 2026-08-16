import {
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Cable,
  CheckCircle2,
  Cpu,
  Network,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  getTransportProvider,
  providersForProtocol,
  transportProviders,
  vehicleProtocols,
} from "./transportRegistry";

import type {
  TransportProviderId,
  VehicleProtocol,
} from "./transportTypes";

import "./transport-compatibility.css";

type TransportCompatibilityPanelProps = {
  activeProvider:
    TransportProviderId;

  onActiveProviderChange: (
    provider:
      TransportProviderId,
  ) => void;
};

function availabilityLabel(
  value:
    "implemented"
    | "bridge-required"
    | "platform-required"
    | "planned",
): string {
  switch (value) {
    case "implemented":
      return "WORKING NOW";

    case "bridge-required":
      return "PROVIDER BRIDGE NEEDED";

    case "platform-required":
      return "PLATFORM SPECIFIC";

    default:
      return "PLANNED";
  }
}

export function TransportCompatibilityPanel({
  activeProvider,
  onActiveProviderChange,
}: TransportCompatibilityPanelProps) {
  const [
    selectedProtocol,
    setSelectedProtocol,
  ] = useState<VehicleProtocol>(
    "can",
  );

  const active =
    getTransportProvider(
      activeProvider,
    );

  const compatible =
    useMemo(
      () =>
        providersForProtocol(
          selectedProtocol,
        ),
      [
        selectedProtocol,
      ],
    );

  return (
    <section className="transport-compat">
      <div className="transport-compat-header">
        <div>
          <span className="eyebrow">
            UNIVERSAL VEHICLE INTERFACE
          </span>

          <h2>
            Transport & Protocol Providers
          </h2>

          <p className="profile-description">
            One NEXUS hardware API with swappable provider
            backends for different interface brands,
            operating systems and vehicle protocols.
          </p>
        </div>

        <div className="transport-readonly">
          <ShieldCheck
            size={14}
          />

          LIVE HARDWARE DEFAULT: READ ONLY
        </div>
      </div>

      <div className="transport-provider-grid">
        {transportProviders.map(
          (provider) => (
            <button
              type="button"
              key={
                provider.id
              }
              className={`transport-provider-card ${
                provider.id ===
                activeProvider
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onActiveProviderChange(
                  provider.id,
                )
              }
            >
              <div className="transport-provider-card-top">
                <Cable
                  size={15}
                />

                <span className={`transport-provider-status ${provider.availability}`}>
                  {availabilityLabel(
                    provider.availability,
                  )}
                </span>
              </div>

              <strong>
                {provider.shortName}
              </strong>

              <span>
                {provider.name}
              </span>

              <small>
                {provider.platforms.join(
                  " · ",
                )}
              </small>
            </button>
          ),
        )}
      </div>

      {active && (
        <div className="transport-active-provider">
          <div className="transport-active-copy">
            <div>
              <Cpu
                size={17}
              />

              <div>
                <span className="eyebrow">
                  ACTIVE PROVIDER
                </span>

                <h3>
                  {active.name}
                </h3>
              </div>
            </div>

            <p>
              {active.description}
            </p>
          </div>

          <div className="transport-active-meta">
            <div>
              <span>
                SDK
              </span>

              <strong>
                {active.sdkName ??
                  "NONE"}
              </strong>
            </div>

            <div>
              <span>
                VENDOR SDK
              </span>

              <strong>
                {active.requiresVendorSdk
                  ? "REQUIRED"
                  : "NO"}
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                {availabilityLabel(
                  active.availability,
                )}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="transport-protocol-browser">
        <div className="transport-protocol-list">
          <div className="transport-protocol-title">
            <Network
              size={14}
            />

            PROTOCOL MATRIX
          </div>

          {vehicleProtocols.map(
            (protocol) => (
              <button
                type="button"
                key={
                  protocol.id
                }
                className={
                  selectedProtocol ===
                  protocol.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedProtocol(
                    protocol.id,
                  )
                }
              >
                {protocol.name}
              </button>
            ),
          )}
        </div>

        <div className="transport-compatible-list">
          <div className="transport-compatible-heading">
            <div>
              <Boxes
                size={15}
              />

              <strong>
                COMPATIBLE PROVIDERS
              </strong>
            </div>

            <span>
              {compatible.length}
            </span>
          </div>

          {compatible.map(
            (provider) => {
              const capability =
                provider.capabilities.find(
                  (item) =>
                    item.protocol ===
                    selectedProtocol,
                );

              return (
                <div
                  key={
                    provider.id
                  }
                  className="transport-compatible-row"
                >
                  <div>
                    {provider.availability ===
                    "implemented" ? (
                      <CheckCircle2
                        size={14}
                      />
                    ) : (
                      <Wrench
                        size={14}
                      />
                    )}

                    <div>
                      <strong>
                        {provider.name}
                      </strong>

                      <span>
                        {availabilityLabel(
                          provider.availability,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="transport-capability-flags">
                    <span className={capability?.read ? "yes" : ""}>
                      RX
                    </span>

                    <span className={capability?.write ? "yes" : ""}>
                      TX
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="transport-foundation-note">
        Provider architecture is universal; vendor-specific
        providers still require their official driver/SDK or
        the matching operating-system transport. NEXUS does
        not claim a provider is operational until its bridge
        is actually implemented and tested.
      </div>
    </section>
  );
}
