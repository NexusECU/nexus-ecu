import {
  Cable,
  CheckCircle2,
  Download,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  getTransportProvider,
} from "./transportRegistry";

import type {
  TransportProviderId,
} from "./transportTypes";

import "./provider-runtime.css";

type ProviderRuntimePanelProps = {
  providerId:
    TransportProviderId;
};

export function ProviderRuntimePanel({
  providerId,
}: ProviderRuntimePanelProps) {
  const provider =
    getTransportProvider(
      providerId,
    );

  if (!provider) {
    return null;
  }

  const implemented =
    provider.availability ===
    "implemented";

  return (
    <div className="provider-runtime">
      <div className="provider-runtime-heading">
        <div>
          {implemented ? (
            <CheckCircle2
              size={16}
            />
          ) : (
            <Wrench
              size={16}
            />
          )}

          <div>
            <span className="eyebrow">
              PROVIDER RUNTIME
            </span>

            <h3>
              {provider.name}
            </h3>
          </div>
        </div>

        <div
          className={`provider-runtime-status ${
            implemented
              ? "implemented"
              : ""
          }`}
        >
          {implemented
            ? "AVAILABLE"
            : "BRIDGE REQUIRED"}
        </div>
      </div>

      {implemented ? (
        <div className="provider-runtime-ready">
          <ShieldCheck
            size={17}
          />

          <div>
            <strong>
              Provider is available in this NEXUS build
            </strong>

            <span>
              Use the connection controls below to attach
              compatible hardware.
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="provider-runtime-unavailable">
            <Cable
              size={18}
            />

            <div>
              <strong>
                Native provider bridge is not installed yet
              </strong>

              <span>
                NEXUS has the transport contract and protocol
                capabilities defined for this provider, but its
                vendor/native bridge still needs to be added and
                tested on the target machine.
              </span>
            </div>
          </div>

          <div className="provider-runtime-meta">
            <div>
              <span>
                PLATFORM
              </span>

              <strong>
                {provider.platforms.join(
                  " / ",
                )}
              </strong>
            </div>

            <div>
              <span>
                SDK / DRIVER
              </span>

              <strong>
                {provider.sdkName ??
                  "PLATFORM TRANSPORT"}
              </strong>
            </div>

            <div>
              <span>
                PROVIDER ID
              </span>

              <strong>
                {provider.id.toUpperCase()}
              </strong>
            </div>
          </div>

          <div className="provider-runtime-note">
            <Download
              size={14}
            />

            <span>
              Install the official driver/SDK for the
              interface, then add the matching NEXUS native
              provider bridge. NEXUS will keep this provider
              disabled until that bridge reports healthy.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
