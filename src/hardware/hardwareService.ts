import {
  invoke,
  isTauri,
} from "@tauri-apps/api/core";

import type {
  HardwareConnectionInfo,
  SerialDeviceInfo,
} from "./hardwareTypes";

function requireDesktop(): void {
  if (
    !isTauri()
  ) {
    throw new Error(
      "Live hardware access requires the NEXUS ECU desktop application.",
    );
  }
}

export async function listSerialDevices():
  Promise<SerialDeviceInfo[]> {
  requireDesktop();

  return invoke<
    SerialDeviceInfo[]
  >(
    "list_serial_ports",
  );
}

export async function connectSerialDevice(
  portName: string,
  baudRate: number,
): Promise<HardwareConnectionInfo> {
  requireDesktop();

  return invoke<
    HardwareConnectionInfo
  >(
    "connect_serial_port",
    {
      portName,
      baudRate,
    },
  );
}

export async function disconnectSerialDevice():
  Promise<HardwareConnectionInfo> {
  requireDesktop();

  return invoke<
    HardwareConnectionInfo
  >(
    "disconnect_serial_port",
  );
}

export async function getHardwareConnection():
  Promise<HardwareConnectionInfo> {
  requireDesktop();

  return invoke<
    HardwareConnectionInfo
  >(
    "hardware_connection_status",
  );
}

export async function readSerialBytes(
  maximumBytes =
    2048,
): Promise<number[]> {
  requireDesktop();

  return invoke<number[]>(
    "read_serial_bytes",
    {
      maximumBytes,
    },
  );
}


export async function configureSlcanMonitor(
  bitrateKbps: number,
): Promise<boolean> {
  requireDesktop();

  return invoke<boolean>(
    "configure_slcan_monitor",
    {
      bitrateKbps,
    },
  );
}

export async function closeSlcanMonitor():
  Promise<boolean> {
  requireDesktop();

  return invoke<boolean>(
    "close_slcan_monitor",
  );
}
