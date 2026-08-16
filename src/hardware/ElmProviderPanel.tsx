import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Power,
  RefreshCw,
  ShieldCheck,
  Usb,
} from "lucide-react";

import {
  disconnectElmAdapter,
  identifyElmAdapter,
  listElmSerialDevices,
} from "./elmService";

import type {
  ElmAdapterInfo,
} from "./elmTypes";

import type {
  SerialDeviceInfo,
} from "./hardwareTypes";

import "./elm-provider.css";

type ElmProviderPanelProps = {
  active: boolean;
};

const baudRates = [
  9600,
  38400,
  57600,
  115200,
  230400,
  500000,
];

function describeDevice(
  device:
    SerialDeviceInfo,
): string {
  const identity = [
    device.product,
    device.manufacturer,
  ]
    .filter(Boolean)
    .join(" · ");

  return identity ||
    device.portType;
}

export function ElmProviderPanel({
  active,
}: ElmProviderPanelProps) {
  const [
    devices,
    setDevices,
  ] = useState<
    SerialDeviceInfo[]
  >([]);

  const [
    selectedPort,
    setSelectedPort,
  ] = useState("");

  const [
    baudRate,
    setBaudRate,
  ] = useState(
    38400,
  );

  const [
    adapter,
    setAdapter,
  ] = useState<
    ElmAdapterInfo | null
  >(
    null,
  );

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(
    null,
  );

  const scanPorts =
    async () => {
      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        const next =
          await listElmSerialDevices();

        setDevices(
          next,
        );

        if (
          !selectedPort &&
          next.length >
            0
        ) {
          setSelectedPort(
            next[0]
              .portName,
          );
        }
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  useEffect(() => {
    if (
      active
    ) {
      void scanPorts();
    }
  }, [
    active,
  ]);

  const identify =
    async () => {
      if (
        !selectedPort
      ) {
        return;
      }

      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        setAdapter(
          await identifyElmAdapter(
            selectedPort,
            baudRate,
          ),
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  const disconnect =
    async () => {
      try {
        setBusy(
          true,
        );

        await disconnectElmAdapter();

        setAdapter(
          null,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      } finally {
        setBusy(
          false,
        );
      }
    };

  if (!active) {
    return null;
  }

  return (
    <section className="elm-provider">
      <div className="elm-provider-header">
        <div>
          <span className="eyebrow">
            ELM / STN OBD PROVIDER
          </span>

          <h3>
            OBD Interface Identification
          </h3>

          <p>
            Detect serial OBD interfaces and query adapter
            identity, voltage and currently selected vehicle
            protocol using adapter-level commands only.
          </p>
        </div>

        <div className="elm-provider-safe">
          <ShieldCheck
            size={14}
          />

          ADAPTER COMMANDS ONLY
        </div>
      </div>

      <div className="elm-connect-grid">
        <label>
          <span>
            SERIAL / COM PORT
          </span>

          <select
            value={
              selectedPort
            }
            disabled={
              busy ||
              adapter !== null
            }
            onChange={(event) =>
              setSelectedPort(
                event.target
                  .value,
              )
            }
          >
            {devices.length ===
            0 ? (
              <option value="">
                No serial devices detected
              </option>
            ) : (
              devices.map(
                (device) => (
                  <option
                    key={
                      device.portName
                    }
                    value={
                      device.portName
                    }
                  >
                    {device.portName}
                    {" — "}
                    {describeDevice(
                      device,
                    )}
                  </option>
                ),
              )
            )}
          </select>
        </label>

        <label>
          <span>
            ADAPTER BAUD
          </span>

          <select
            value={
              baudRate
            }
            disabled={
              busy ||
              adapter !== null
            }
            onChange={(event) =>
              setBaudRate(
                Number(
                  event.target
                    .value,
                ),
              )
            }
          >
            {baudRates.map(
              (rate) => (
                <option
                  key={
                    rate
                  }
                  value={
                    rate
                  }
                >
                  {rate.toLocaleString()}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          disabled={
            busy ||
            adapter !== null
          }
          onClick={
            scanPorts
          }
        >
          <RefreshCw
            size={14}
          />

          SCAN PORTS
        </button>

        {adapter ? (
          <button
            type="button"
            className="danger"
            disabled={
              busy
            }
            onClick={
              disconnect
            }
          >
            <Power
              size={14}
            />

            DISCONNECT
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            disabled={
              busy ||
              !selectedPort
            }
            onClick={
              identify
            }
          >
            <Usb
              size={14}
            />

            IDENTIFY ADAPTER
          </button>
        )}
      </div>

      {error && (
        <div className="elm-error">
          {error}
        </div>
      )}

      {!adapter ? (
        <div className="elm-empty">
          <Usb
            size={24}
          />

          <strong>
            Select an ELM/STN-style interface
          </strong>

          <span>
            Common devices expose a serial COM port over
            USB or Bluetooth. NEXUS does not send vehicle
            PID requests during this identification step.
          </span>
        </div>
      ) : (
        <>
          <div className="elm-identity">
            <div className="elm-identity-main">
              {adapter.healthy ? (
                <CheckCircle2
                  size={18}
                />
              ) : (
                <CircleAlert
                  size={18}
                />
              )}

              <div>
                <strong>
                  {adapter.adapterFamily}
                  {""}
                  INTERFACE
                </strong>

                <span>
                  {adapter.version ??
                    "Version not reported"}
                </span>
              </div>
            </div>

            <span
              className={`elm-health ${
                adapter.healthy
                  ? "healthy"
                  : ""
              }`}
            >
              {adapter.healthy
                ? "ADAPTER READY"
                : "CHECK RESPONSE"}
            </span>
          </div>

          <div className="elm-stats">
            <ElmStat
              label="PORT"
              value={
                adapter.portName
              }
            />

            <ElmStat
              label="BAUD"
              value={
                adapter.baudRate
                  .toLocaleString()
              }
            />

            <ElmStat
              label="VOLTAGE"
              value={
                adapter.voltage ??
                "—"
              }
            />

            <ElmStat
              label="PROTOCOL"
              value={
                adapter.protocol ??
                "—"
              }
            />

            <ElmStat
              label="PROTOCOL ID"
              value={
                adapter.protocolNumber ??
                "—"
              }
            />

            <ElmStat
              label="FAMILY"
              value={
                adapter.adapterFamily
              }
            />
          </div>

          <div className="elm-details">
            <div>
              <span>
                DESCRIPTION
              </span>

              <strong>
                {adapter.description ??
                  "Not reported"}
              </strong>
            </div>

            <div>
              <span>
                IDENTIFIER
              </span>

              <strong>
                {adapter.identifier ??
                  "Not reported"}
              </strong>
            </div>
          </div>

          {adapter.warnings.length >
            0 && (
            <div className="elm-warnings">
              {adapter.warnings.map(
                (
                  warning,
                  index,
                ) => (
                  <div
                    key={`${warning}-${index}`}
                  >
                    <CircleAlert
                      size={12}
                    />

                    {warning}
                  </div>
                ),
              )}
            </div>
          )}
        </>
      )}

      <div className="elm-note">
        Identification uses adapter commands such as ATI,
        AT@1, AT@2, ATRV, ATDP and ATDPN. No Mode 01 PID,
        UDS, KWP, ECU programming or CAN transmit request is
        issued by this screen.
      </div>
    </section>
  );
}

function ElmStat({
  label,
  value,
}: {
  label: string;

  value: string;
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
