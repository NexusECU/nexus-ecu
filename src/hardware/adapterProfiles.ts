import type {
  AdapterProfile,
} from "./adapterProfileTypes";

export const ADAPTER_PROFILES:
  AdapterProfile[] = [
  {
    providerId:
      "raw-serial",

    displayName:
      "Generic Raw Serial",

    family:
      "USB Serial / UART Transport",

    supportState:
      "supported",

    platforms: [
      "Windows",
      "Linux",
      "macOS",
    ],

    driverRequirement:
      "USB serial driver",

    bridgeRequirement:
      "Built-in NEXUS raw serial transport",

    protocols: [
      "Raw serial receive",
      "Provider-specific serial protocols",
    ],

    recommendedBaudRates: [
      9600,
      38400,
      57600,
      115200,
      230400,
    ],

    passiveReceive:
      true,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Manual port selection only.",
      "NEXUS never treats an arbitrary COM port as a confirmed ECU adapter.",
    ],
  },
  {
    providerId:
      "slcan",

    displayName:
      "SLCAN / CANable",

    family:
      "SLCAN / CANable / Serial CAN",

    supportState:
      "supported",

    platforms: [
      "Windows",
      "Linux",
      "macOS",
    ],

    driverRequirement:
      "USB serial driver",

    bridgeRequirement:
      "Built-in NEXUS serial bridge",

    protocols: [
      "SLCAN",
      "Raw serial receive",
      "11-bit CAN",
      "29-bit CAN",
    ],

    recommendedBaudRates: [
      115200,
      230400,
      460800,
      921600,
    ],

    passiveReceive:
      true,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Receive-only by default.",
      "Generic serial ports are never auto-connected.",
    ],
  },
  {
    providerId:
      "elm-obd",

    displayName:
      "ELM / STN OBD",

    family:
      "ELM327 / STN11xx / STN21xx",

    supportState:
      "supported",

    platforms: [
      "Windows",
      "Linux",
      "macOS",
    ],

    driverRequirement:
      "USB/Bluetooth serial driver for the adapter",

    bridgeRequirement:
      "Built-in ELM/STN provider layer",

    protocols: [
      "OBD-II",
      "ISO 15765-4 CAN",
      "Mode 01",
      "Mode 03",
      "Mode 09",
    ],

    recommendedBaudRates: [
      38400,
      115200,
      230400,
    ],

    passiveReceive:
      true,

    standardDiagnostics:
      true,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Best suited for standard diagnostics and vehicle identification.",
      "Not treated as a generic ECU flashing interface.",
    ],
  },
  {
    providerId:
      "j2534",

    displayName:
      "SAE J2534 Pass-Thru",

    family:
      "J2534-1 / J2534-2",

    supportState:
      "bridge-required",

    platforms: [
      "Windows",
    ],

    driverRequirement:
      "Vendor J2534 driver / PassThru DLL",

    bridgeRequirement:
      "NEXUS J2534 native bridge",

    protocols: [
      "ISO 15765",
      "CAN",
      "ISO 9141",
      "ISO 14230",
      "J1850",
      "UDS (device dependent)",
    ],

    recommendedBaudRates: [],

    passiveReceive:
      false,

    standardDiagnostics:
      true,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Device discovery can validate installed vendor DLLs.",
      "Live channel operations remain disabled until the native bridge is installed and tested.",
    ],
  },
  {
    providerId:
      "pcan",

    displayName:
      "PEAK PCAN",

    family:
      "PCAN-USB / PCAN-USB FD",

    supportState:
      "bridge-required",

    platforms: [
      "Windows",
      "Linux",
    ],

    driverRequirement:
      "PEAK PCAN driver / PCAN-Basic",

    bridgeRequirement:
      "NEXUS PCAN native bridge",

    protocols: [
      "CAN",
      "CAN FD",
      "ISO-TP (via NEXUS layer)",
    ],

    recommendedBaudRates: [
      125000,
      250000,
      500000,
      1000000,
    ],

    passiveReceive:
      false,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Provider contract is present.",
      "Native bridge still required before live controls are enabled.",
    ],
  },
  {
    providerId:
      "kvaser",

    displayName:
      "Kvaser CAN",

    family:
      "Kvaser Leaf / U100 / Memorator",

    supportState:
      "bridge-required",

    platforms: [
      "Windows",
      "Linux",
    ],

    driverRequirement:
      "Kvaser CANlib",

    bridgeRequirement:
      "NEXUS Kvaser native bridge",

    protocols: [
      "CAN",
      "CAN FD",
      "ISO-TP (via NEXUS layer)",
    ],

    recommendedBaudRates: [
      125000,
      250000,
      500000,
      1000000,
    ],

    passiveReceive:
      false,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Native provider bridge required.",
    ],
  },
  {
    providerId:
      "vector-xl",

    displayName:
      "Vector XL",

    family:
      "VN16xx / VN56xx / XL Driver Library",

    supportState:
      "bridge-required",

    platforms: [
      "Windows",
    ],

    driverRequirement:
      "Vector XL Driver Library",

    bridgeRequirement:
      "NEXUS Vector XL native bridge",

    protocols: [
      "CAN",
      "CAN FD",
      "ISO-TP (via NEXUS layer)",
    ],

    recommendedBaudRates: [
      125000,
      250000,
      500000,
      1000000,
    ],

    passiveReceive:
      false,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Native provider bridge required.",
    ],
  },
  {
    providerId:
      "socketcan",

    displayName:
      "SocketCAN",

    family:
      "Linux SocketCAN",

    supportState:
      "platform-specific",

    platforms: [
      "Linux",
    ],

    driverRequirement:
      "Linux SocketCAN interface",

    bridgeRequirement:
      "Platform-native SocketCAN runtime",

    protocols: [
      "CAN",
      "CAN FD",
      "ISO-TP (kernel or NEXUS layer)",
    ],

    recommendedBaudRates: [
      125000,
      250000,
      500000,
      1000000,
    ],

    passiveReceive:
      true,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Unavailable on Windows builds.",
      "Requires a configured canX interface.",
    ],
  },
  {
    providerId:
      "doip",

    displayName:
      "DoIP",

    family:
      "Diagnostics over IP",

    supportState:
      "planned",

    platforms: [
      "Windows",
      "Linux",
      "macOS",
    ],

    driverRequirement:
      "Ethernet network interface",

    bridgeRequirement:
      "NEXUS DoIP transport",

    protocols: [
      "DoIP",
      "UDS over IP",
    ],

    recommendedBaudRates: [],

    passiveReceive:
      false,

    standardDiagnostics:
      true,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Transport architecture reserved.",
      "Live DoIP session handling is not implemented yet.",
    ],
  },
  {
    providerId:
      "generic-ethernet",

    displayName:
      "Raw Ethernet",

    family:
      "Automotive Ethernet",

    supportState:
      "planned",

    platforms: [
      "Windows",
      "Linux",
      "macOS",
    ],

    driverRequirement:
      "Ethernet network interface",

    bridgeRequirement:
      "NEXUS Ethernet provider",

    protocols: [
      "Raw Ethernet",
      "Vendor-specific diagnostics",
    ],

    recommendedBaudRates: [],

    passiveReceive:
      false,

    standardDiagnostics:
      false,

    romRead:
      false,

    romWrite:
      false,

    notes: [
      "Planned provider.",
    ],
  },
];

export function getAdapterProfile(
  providerId:
    AdapterProfile[
      "providerId"
    ],
): AdapterProfile | null {
  return (
    ADAPTER_PROFILES.find(
      profile =>
        profile.providerId ===
        providerId,
    ) ??
    null
  );
}
