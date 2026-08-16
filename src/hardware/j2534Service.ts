import {
  invoke,
  isTauri,
} from "@tauri-apps/api/core";

import type {
  J2534Connection,
  J2534Device,
} from "./j2534Types";

export async function discoverJ2534Devices():
  Promise<J2534Device[]> {
  if (
    !isTauri()
  ) {
    throw new Error(
      "J2534 discovery requires the NEXUS ECU Windows desktop application.",
    );
  }

  return invoke<
    J2534Device[]
  >(
    "discover_j2534_devices",
  );
}


export async function openJ2534Device(
  device:
    J2534Device,
): Promise<J2534Connection> {
  if (
    !isTauri()
  ) {
    throw new Error(
      "J2534 device access requires the NEXUS ECU Windows desktop application.",
    );
  }

  return invoke<
    J2534Connection
  >(
    "open_j2534_device",
    {
      deviceName:
        device.name,

      vendor:
        device.vendor,

      functionLibrary:
        device.functionLibrary,
    },
  );
}

export async function closeJ2534Device():
  Promise<J2534Connection> {
  if (
    !isTauri()
  ) {
    throw new Error(
      "J2534 device access requires the NEXUS ECU Windows desktop application.",
    );
  }

  return invoke<
    J2534Connection
  >(
    "close_j2534_device",
  );
}

export async function getJ2534Connection():
  Promise<J2534Connection> {
  if (
    !isTauri()
  ) {
    throw new Error(
      "J2534 device access requires the NEXUS ECU Windows desktop application.",
    );
  }

  return invoke<
    J2534Connection
  >(
    "j2534_connection_status",
  );
}
