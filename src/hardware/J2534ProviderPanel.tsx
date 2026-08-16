import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Cpu,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  closeJ2534Device,
  discoverJ2534Devices,
  getJ2534Connection,
  openJ2534Device,
} from "./j2534Service";

import type {
  J2534Connection,
  J2534Device,
} from "./j2534Types";

import "./j2534-provider.css";

type J2534ProviderPanelProps = {
  active: boolean;
};

function symbolState(
  value: boolean,
): string {
  return value
    ? "OK"
    : "MISSING";
}

export function J2534ProviderPanel({
  active,
}: J2534ProviderPanelProps) {
  const [
    devices,
    setDevices,
  ] = useState<
    J2534Device[]
  >([]);

  const [
    selectedLibrary,
    setSelectedLibrary,
  ] = useState("");

  const [
    connection,
    setConnection,
  ] = useState<J2534Connection>({
    connected: false,
    deviceId: null,
    deviceName: null,
    vendor: null,
    functionLibrary: null,
    openedAt: null,
    lastErrorCode: null,
    status: "DISCONNECTED",
  });

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

  const selectedDevice =
    devices.find(
      (device) =>
        device.functionLibrary ===
        selectedLibrary,
    ) ??
    null;

  const openDevice =
    async () => {
      if (
        !selectedDevice
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

        setConnection(
          await openJ2534Device(
            selectedDevice,
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

  const closeDevice =
    async () => {
      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        setConnection(
          await closeJ2534Device(),
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

  const scan =
    async () => {
      try {
        setBusy(
          true,
        );

        setError(
          null,
        );

        const discovered =
          await discoverJ2534Devices();

        setDevices(
          discovered,
        );

        const preferred =
          discovered.find(
            (device) =>
              device.dllLoadable &&
              device.hasPassThruOpen &&
              device.hasPassThruClose,
          ) ??
          discovered[0];

        if (
          preferred &&
          !selectedLibrary
        ) {
          setSelectedLibrary(
            preferred.functionLibrary,
          );
        }

        try {
          setConnection(
            await getJ2534Connection(),
          );
        } catch {
          // Discovery remains useful even if no live bridge state exists yet.
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
      void scan();
    }
  }, [
    active,
  ]);

  if (!active) {
    return null;
  }

  return (
    <section className="j2534-provider">
      <div className="j2534-header">
        <div>
          <span className="eyebrow">
            WINDOWS PASS-THRU
          </span>

          <h3>
            J2534 Device Discovery
          </h3>

          <p>
            Discover installed SAE J2534 pass-thru interfaces,
            validate their vendor DLL exports, then open or
            close the physical pass-thru device without
            creating a vehicle-network channel.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={scan}
        >
          <RefreshCw
            size={14}
          />

          SCAN J2534
        </button>
      </div>

      <div className="j2534-safety">
        <ShieldCheck
          size={14}
        />

        DEVICE OPEN/CLOSE ONLY · NO VEHICLE NETWORK CHANNEL
      </div>

      <div className="j2534-bridge-controls">
        <label>
          <span>
            J2534 DEVICE / DLL
          </span>

          <select
            value={
              selectedLibrary
            }
            disabled={
              busy ||
              connection.connected
            }
            onChange={(event) =>
              setSelectedLibrary(
                event.target.value,
              )
            }
          >
            {devices.length ===
            0 ? (
              <option value="">
                No J2534 devices discovered
              </option>
            ) : (
              devices.map(
                (device) => (
                  <option
                    key={
                      device.functionLibrary
                    }
                    value={
                      device.functionLibrary
                    }
                  >
                    {device.name}
                    {" — "}
                    {device.architecture}
                  </option>
                ),
              )
            )}
          </select>
        </label>

        {connection.connected ? (
          <button
            type="button"
            className="danger"
            disabled={busy}
            onClick={
              closeDevice
            }
          >
            DISCONNECT J2534
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            disabled={
              busy ||
              !selectedDevice ||
              !selectedDevice.dllLoadable ||
              !selectedDevice.hasPassThruOpen ||
              !selectedDevice.hasPassThruClose
            }
            onClick={
              openDevice
            }
          >
            OPEN J2534 DEVICE
          </button>
        )}
      </div>

      <div className="j2534-connection-status">
        <div>
          <span>
            BRIDGE
          </span>

          <strong>
            {connection.connected
              ? "CONNECTED"
              : "DISCONNECTED"}
          </strong>
        </div>

        <div>
          <span>
            DEVICE ID
          </span>

          <strong>
            {connection.deviceId ??
              "—"}
          </strong>
        </div>

        <div>
          <span>
            DEVICE
          </span>

          <strong>
            {connection.deviceName ??
              "—"}
          </strong>
        </div>

        <div>
          <span>
            STATUS
          </span>

          <strong>
            {connection.status}
          </strong>
        </div>
      </div>

      {error && (
        <div className="j2534-error">
          {error}
        </div>
      )}

      {devices.length ===
      0 ? (
        <div className="j2534-empty">
          <Cpu
            size={24}
          />

          <strong>
            No J2534 devices found
          </strong>

          <span>
            Install the official driver/software package
            for your pass-thru interface, then scan again.
          </span>
        </div>
      ) : (
        <div className="j2534-device-list">
          {devices.map(
            (device) => {
              const coreHealthy =
                device.dllLoadable &&
                device.hasPassThruOpen &&
                device.hasPassThruClose &&
                device.hasPassThruConnect &&
                device.hasPassThruDisconnect &&
                device.hasPassThruReadMsgs &&
                device.hasPassThruWriteMsgs;

              return (
                <div
                  key={`${device.registryPath}-${device.name}`}
                  className="j2534-device-card"
                >
                  <div className="j2534-device-title">
                    <div>
                      {coreHealthy ? (
                        <CheckCircle2
                          size={16}
                        />
                      ) : (
                        <TriangleAlert
                          size={16}
                        />
                      )}

                      <div>
                        <strong>
                          {device.name}
                        </strong>

                        <span>
                          {device.vendor ??
                            "Unknown vendor"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`j2534-health ${
                        coreHealthy
                          ? "healthy"
                          : ""
                      }`}
                    >
                      {coreHealthy
                        ? "J2534 CORE READY"
                        : "DRIVER CHECK REQUIRED"}
                    </span>
                  </div>

                  <div className="j2534-device-meta">
                    <div>
                      <span>
                        DLL
                      </span>

                      <strong>
                        {device.functionLibrary}
                      </strong>
                    </div>

                    <div>
                      <span>
                        ARCH
                      </span>

                      <strong>
                        {device.architecture}
                      </strong>
                    </div>

                    <div>
                      <span>
                        LOADABLE
                      </span>

                      <strong>
                        {device.dllLoadable
                          ? "YES"
                          : "NO"}
                      </strong>
                    </div>
                  </div>

                  <div className="j2534-symbol-grid">
                    <Symbol
                      name="PassThruOpen"
                      value={
                        device.hasPassThruOpen
                      }
                    />

                    <Symbol
                      name="PassThruClose"
                      value={
                        device.hasPassThruClose
                      }
                    />

                    <Symbol
                      name="PassThruConnect"
                      value={
                        device.hasPassThruConnect
                      }
                    />

                    <Symbol
                      name="PassThruDisconnect"
                      value={
                        device.hasPassThruDisconnect
                      }
                    />

                    <Symbol
                      name="PassThruReadMsgs"
                      value={
                        device.hasPassThruReadMsgs
                      }
                    />

                    <Symbol
                      name="PassThruWriteMsgs"
                      value={
                        device.hasPassThruWriteMsgs
                      }
                    />
                  </div>

                  {device.configApplication && (
                    <div className="j2534-config-app">
                      CONFIG APP:
                      {""}
                      {device.configApplication}
                    </div>
                  )}

                  {device.error && (
                    <div className="j2534-device-error">
                      {device.error}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function Symbol({
  name,
  value,
}: {
  name: string;
  value: boolean;
}) {
  return (
    <div>
      <span>
        {name}
      </span>

      <strong
        className={
          value
            ? "ok"
            : ""
        }
      >
        {symbolState(
          value,
        )}
      </strong>
    </div>
  );
}
