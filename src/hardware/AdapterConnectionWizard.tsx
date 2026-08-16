import {
  Cable,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  PlugZap,
  RotateCw,
  Save,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ADAPTER_PROFILES,
  getAdapterProfile,
} from "./adapterProfiles";

import {
  buildConnectionTestReport,
} from "./adapterConnectionWizardService";

import type {
  AdapterConnectionSettings,
} from "./adapterConnectionWizardTypes";

import type {
  HardwareConnectionInfo,
} from "./hardwareTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import "./adapter-connection-wizard.css";

type Props = {
  activeProvider:
    TransportProviderId;

  onSelectProvider: (
    provider:
      TransportProviderId,
  ) => void;

  availablePorts:
    string[];

  selectedPort:
    string;

  onSelectPort: (
    port:
      string,
  ) => void;

  selectedBaud:
    number;

  onSelectBaud: (
    baud:
      number,
  ) => void;

  selectedCanBitrateKbps:
    number;

  onSelectCanBitrateKbps: (
    bitrate:
      number,
  ) => void;

  connection:
    HardwareConnectionInfo;

  error:
    string | null;

  framesObserved:
    number;
};

const STORAGE_KEY =
  "nexus.adapterConnectionWizard.lastSettings";

export function AdapterConnectionWizard({
  activeProvider,
  onSelectProvider,
  availablePorts,
  selectedPort,
  onSelectPort,
  selectedBaud,
  onSelectBaud,
  selectedCanBitrateKbps,
  onSelectCanBitrateKbps,
  connection,
  error,
  framesObserved,
}: Props) {
  const [
    autoBaud,
    setAutoBaud,
  ] = useState(
    false,
  );

  const profile =
    getAdapterProfile(
      activeProvider,
    );

  const settings:
    AdapterConnectionSettings = {
      providerId:
        activeProvider,
      serialPort:
        selectedPort,
      serialBaud:
        selectedBaud,
      canBitrateKbps:
        selectedCanBitrateKbps,
      autoBaud,
    };

  const report =
    useMemo(
      () =>
        buildConnectionTestReport(
          settings,
          connection,
          error,
          framesObserved,
        ),
      [
        activeProvider,
        selectedPort,
        selectedBaud,
        selectedCanBitrateKbps,
        autoBaud,
        connection,
        error,
        framesObserved,
      ],
    );

  useEffect(
    () => {
      try {
        const raw =
          localStorage.getItem(
            STORAGE_KEY,
          );

        if (!raw) {
          return;
        }

        const saved =
          JSON.parse(
            raw,
          ) as Partial<AdapterConnectionSettings>;

        if (
          saved.providerId
        ) {
          onSelectProvider(
            saved.providerId,
          );
        }

        if (
          saved.serialPort
        ) {
          onSelectPort(
            saved.serialPort,
          );
        }

        if (
          saved.serialBaud
        ) {
          onSelectBaud(
            saved.serialBaud,
          );
        }

        if (
          saved.canBitrateKbps
        ) {
          onSelectCanBitrateKbps(
            saved.canBitrateKbps,
          );
        }

        if (
          typeof saved.autoBaud ===
          "boolean"
        ) {
          setAutoBaud(
            saved.autoBaud,
          );
        }
      } catch {
        // Ignore malformed remembered settings.
      }
    },
    [],
  );

  const saveSettings =
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          settings,
        ),
      );
    };

  const recommendedSerialRates =
    profile?.recommendedBaudRates.filter(
      rate =>
        rate <
        1000000,
    ) ?? [];

  return (
    <section className="adapter-connection-wizard">
      <div className="adapter-connection-wizard-header">
        <div>
          <PlugZap
            size={16}
          />

          <div>
            <span className="eyebrow">
              ADAPTER CONNECTION WIZARD · V7.6
            </span>

            <h3>
              Guided Hardware Setup
            </h3>
          </div>
        </div>

        <State
          result={
            report.result
          }
        />
      </div>

      <div className="adapter-wizard-steps">
        <div className="adapter-wizard-step">
          <span>
            1
          </span>

          <strong>
            SELECT PROVIDER
          </strong>

          <select
            value={
              activeProvider
            }
            onChange={
              event =>
                onSelectProvider(
                  event.target.value as TransportProviderId,
                )
            }
          >
            {ADAPTER_PROFILES.map(
              item => (
                <option
                  key={
                    item.providerId
                  }
                  value={
                    item.providerId
                  }
                >
                  {item.displayName}
                  {" — "}
                  {item.supportState.toUpperCase()}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="adapter-wizard-step">
          <span>
            2
          </span>

          <strong>
            INTERFACE
          </strong>

          <select
            value={
              selectedPort
            }
            disabled={
              availablePorts.length ===
              0
            }
            onChange={
              event =>
                onSelectPort(
                  event.target.value,
                )
            }
          >
            {availablePorts.length ===
            0 ? (
              <option value="">
                NO SERIAL PORTS
              </option>
            ) : (
              availablePorts.map(
                port => (
                  <option
                    key={
                      port
                    }
                    value={
                      port
                    }
                  >
                    {port}
                  </option>
                ),
              )
            )}
          </select>
        </div>

        <div className="adapter-wizard-step">
          <span>
            3
          </span>

          <strong>
            SERIAL BAUD
          </strong>

          <select
            value={
              selectedBaud
            }
            disabled={
              autoBaud
            }
            onChange={
              event =>
                onSelectBaud(
                  Number(
                    event.target.value,
                  ),
                )
            }
          >
            {Array.from(
              new Set([
                9600,
                38400,
                57600,
                115200,
                230400,
                460800,
                921600,
                ...recommendedSerialRates,
              ]),
            )
              .sort(
                (
                  a,
                  b,
                ) =>
                  a - b,
              )
              .map(
                baud => (
                  <option
                    key={
                      baud
                    }
                    value={
                      baud
                    }
                  >
                    {baud}
                  </option>
                ),
              )}
          </select>

          <label className="adapter-wizard-checkbox">
            <input
              type="checkbox"
              checked={
                autoBaud
              }
              onChange={
                event =>
                  setAutoBaud(
                    event.target.checked,
                  )
              }
            />

            AUTO DETECT
          </label>
        </div>

        <div className="adapter-wizard-step">
          <span>
            4
          </span>

          <strong>
            CAN BITRATE
          </strong>

          <select
            value={
              selectedCanBitrateKbps
            }
            onChange={
              event =>
                onSelectCanBitrateKbps(
                  Number(
                    event.target.value,
                  ),
                )
            }
          >
            {[125,250,500,1000].map(
              bitrate => (
                <option
                  key={
                    bitrate
                  }
                  value={
                    bitrate
                  }
                >
                  {bitrate}
                  {" "}
                  KBIT/S
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {profile && (
        <div className="adapter-wizard-profile">
          <div>
            <span>
              PROFILE
            </span>

            <strong>
              {profile.displayName}
            </strong>
          </div>

          <div>
            <span>
              DRIVER
            </span>

            <strong>
              {profile.driverRequirement}
            </strong>
          </div>

          <div>
            <span>
              BRIDGE
            </span>

            <strong>
              {profile.bridgeRequirement}
            </strong>
          </div>

          <div>
            <span>
              PROTOCOLS
            </span>

            <strong>
              {profile.protocols.join(
                " · ",
              )}
            </strong>
          </div>
        </div>
      )}

      <div className={`adapter-wizard-report ${report.result}`}>
        <div className="adapter-wizard-report-title">
          <Cable
            size={13}
          />

          <strong>
            {report.title}
          </strong>
        </div>

        <p>
          {report.detail}
        </p>

        {report.recommendations.length >
        0 && (
          <div className="adapter-wizard-recommendations">
            {report.recommendations.map(
              item => (
                <span
                  key={
                    item
                  }
                >
                  {item}
                </span>
              ),
            )}
          </div>
        )}
      </div>

      <div className="adapter-wizard-footer">
        <button
          type="button"
          onClick={
            saveSettings
          }
        >
          <Save
            size={12}
          />

          REMEMBER SETTINGS
        </button>

        <span>
          NEXUS will not auto-connect to an arbitrary COM port.
        </span>
      </div>
    </section>
  );
}

function State({
  result,
}: {
  result:
    "idle" |
    "testing" |
    "connected" |
    "partial" |
    "failed";
}) {
  return (
    <div className={`adapter-wizard-state ${result}`}>
      {result ===
      "connected" ? (
        <CheckCircle2
          size={12}
        />
      ) : result ===
        "failed" ? (
        <CircleAlert
          size={12}
        />
      ) : result ===
        "testing" ? (
        <RotateCw
          size={12}
        />
      ) : (
        <CircleHelp
          size={12}
        />
      )}

      {result.toUpperCase()}
    </div>
  );
}
