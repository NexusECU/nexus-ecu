import {
  invoke,
  isTauri,
} from "@tauri-apps/api/core";

import type {
  SerialDeviceInfo,
} from "./hardwareTypes";

import type {
  ElmAdapterInfo,
} from "./elmTypes";

function requireDesktop():
  void {
  if (
    !isTauri()
  ) {
    throw new Error(
      "ELM/STN hardware access requires the NEXUS ECU desktop application.",
    );
  }
}

export async function listElmSerialDevices():
  Promise<SerialDeviceInfo[]> {
  requireDesktop();

  return invoke<
    SerialDeviceInfo[]
  >(
    "list_serial_ports",
  );
}

export async function identifyElmAdapter(
  portName: string,
  baudRate: number,
): Promise<ElmAdapterInfo> {
  requireDesktop();

  return invoke<
    ElmAdapterInfo
  >(
    "identify_elm_adapter",
    {
      portName,
      baudRate,
    },
  );
}

export async function disconnectElmAdapter():
  Promise<boolean> {
  requireDesktop();

  return invoke<boolean>(
    "disconnect_elm_adapter",
  );
}
