import type {
  TransportProvider,
  TransportProviderId,
  VehicleProtocol,
} from "./transportTypes";

export const transportProviders:
  TransportProvider[] = [
    {
      id: "raw-serial",
      name: "Generic Serial / USB",
      shortName: "SERIAL",
      description:
        "Generic COM/TTY transport for adapters exposing an ASCII or binary serial protocol.",
      platforms: [
        "Windows",
        "Linux",
        "macOS",
      ],
      availability:
        "implemented",
      requiresVendorSdk:
        false,
      sdkName:
        null,
      capabilities: [
        {
          protocol:
            "raw-serial",
          read: true,
          write: false,
          notes:
            "NEXUS keeps generic serial software receive-only.",
        },
      ],
    },

    {
      id: "slcan",
      name: "SLCAN / Lawicel Serial CAN",
      shortName: "SLCAN",
      description:
        "ASCII CAN-over-serial adapters using Lawicel/SLCAN-style framing.",
      platforms: [
        "Windows",
        "Linux",
        "macOS",
      ],
      availability:
        "implemented",
      requiresVendorSdk:
        false,
      sdkName:
        null,
      capabilities: [
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "isotp",
          read: true,
          write: false,
          notes:
            "Current decoder handles passive diagnostic responses; active transport is not enabled.",
        },
        {
          protocol:
            "obd2",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "elm-obd",
      name: "ELM / STN OBD Interface",
      shortName: "ELM/STN",
      description:
        "Serial or Bluetooth OBD interfaces using an AT-command interpreter.",
      platforms: [
        "Windows",
        "Linux",
        "macOS",
      ],
      availability:
        "implemented",
      requiresVendorSdk:
        false,
      sdkName:
        null,
      capabilities: [
        {
          protocol:
            "obd2",
          read: true,
          write: false,
        },
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "isotp",
          read: true,
          write: false,
        },
        {
          protocol:
            "kwp2000",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "j2534",
      name: "SAE J2534 Pass-Thru",
      shortName: "J2534",
      description:
        "Windows pass-thru interface layer for multi-vendor vehicle interfaces and diagnostic/programming transports.",
      platforms: [
        "Windows",
      ],
      availability:
        "implemented",
      requiresVendorSdk:
        true,
      sdkName:
        "J2534 vendor DLL",
      capabilities: [
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "can-fd",
          read: true,
          write: false,
        },
        {
          protocol:
            "isotp",
          read: true,
          write: false,
        },
        {
          protocol:
            "uds",
          read: true,
          write: false,
        },
        {
          protocol:
            "kwp2000",
          read: true,
          write: false,
        },
        {
          protocol:
            "j1939",
          read: true,
          write: false,
        },
        {
          protocol:
            "j1708",
          read: true,
          write: false,
        },
        {
          protocol:
            "sw-can",
          read: true,
          write: false,
        },
        {
          protocol:
            "ft-can",
          read: true,
          write: false,
        },
        {
          protocol:
            "tp20",
          read: true,
          write: false,
        },
        {
          protocol:
            "ethernet",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "pcan",
      name: "PEAK PCAN",
      shortName: "PCAN",
      description:
        "Native PEAK-System PCAN provider for CAN, CAN FD and CAN XL capable interfaces.",
      platforms: [
        "Windows",
        "Linux",
      ],
      availability:
        "bridge-required",
      requiresVendorSdk:
        true,
      sdkName:
        "PCAN-Basic",
      capabilities: [
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "can-fd",
          read: true,
          write: false,
        },
        {
          protocol:
            "can-xl",
          read: true,
          write: false,
        },
        {
          protocol:
            "isotp",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "kvaser",
      name: "Kvaser CANlib",
      shortName: "KVASER",
      description:
        "Native Kvaser provider using the common CANlib family of APIs.",
      platforms: [
        "Windows",
        "Linux",
      ],
      availability:
        "bridge-required",
      requiresVendorSdk:
        true,
      sdkName:
        "Kvaser CANlib SDK",
      capabilities: [
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "can-fd",
          read: true,
          write: false,
        },
        {
          protocol:
            "lin",
          read: true,
          write: false,
        },
        {
          protocol:
            "j1587",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "vector-xl",
      name: "Vector XL Driver",
      shortName: "VECTOR",
      description:
        "Native Vector interface provider using the XL Driver Library family.",
      platforms: [
        "Windows",
      ],
      availability:
        "bridge-required",
      requiresVendorSdk:
        true,
      sdkName:
        "Vector XL Driver Library",
      capabilities: [
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "can-fd",
          read: true,
          write: false,
        },
        {
          protocol:
            "lin",
          read: true,
          write: false,
        },
        {
          protocol:
            "flexray",
          read: true,
          write: false,
        },
        {
          protocol:
            "ethernet",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "socketcan",
      name: "Linux SocketCAN",
      shortName: "SOCKETCAN",
      description:
        "Linux kernel CAN network interface provider for hardware exposed as can0/can1 and similar interfaces.",
      platforms: [
        "Linux",
      ],
      availability:
        "platform-required",
      requiresVendorSdk:
        false,
      sdkName:
        null,
      capabilities: [
        {
          protocol:
            "can",
          read: true,
          write: false,
        },
        {
          protocol:
            "can-fd",
          read: true,
          write: false,
        },
        {
          protocol:
            "isotp",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "doip",
      name: "Diagnostics over IP",
      shortName: "DOIP",
      description:
        "Ethernet diagnostic transport provider for vehicle networks exposing diagnostics over IP.",
      platforms: [
        "Windows",
        "Linux",
        "macOS",
      ],
      availability:
        "planned",
      requiresVendorSdk:
        false,
      sdkName:
        null,
      capabilities: [
        {
          protocol:
            "doip",
          read: true,
          write: false,
        },
        {
          protocol:
            "uds",
          read: true,
          write: false,
        },
        {
          protocol:
            "ethernet",
          read: true,
          write: false,
        },
      ],
    },

    {
      id: "generic-ethernet",
      name: "Generic Ethernet Vehicle Interface",
      shortName: "ETHERNET",
      description:
        "TCP/UDP vehicle interface foundation for Ethernet gateways and vendor network adapters.",
      platforms: [
        "Windows",
        "Linux",
        "macOS",
      ],
      availability:
        "planned",
      requiresVendorSdk:
        false,
      sdkName:
        null,
      capabilities: [
        {
          protocol:
            "ethernet",
          read: true,
          write: false,
        },
        {
          protocol:
            "doip",
          read: true,
          write: false,
        },
      ],
    },
  ];

export function getTransportProvider(
  id:
    TransportProviderId,
): TransportProvider | undefined {
  return transportProviders.find(
    (provider) =>
      provider.id === id,
  );
}

export function providersForProtocol(
  protocol:
    VehicleProtocol,
): TransportProvider[] {
  return transportProviders.filter(
    (provider) =>
      provider.capabilities.some(
        (capability) =>
          capability.protocol ===
          protocol,
      ),
  );
}

export const vehicleProtocols:
  {
    id: VehicleProtocol;
    name: string;
  }[] = [
    { id: "raw-serial", name: "Raw Serial" },
    { id: "can", name: "CAN 2.0 / Classical CAN" },
    { id: "can-fd", name: "CAN FD" },
    { id: "can-xl", name: "CAN XL" },
    { id: "lin", name: "LIN" },
    { id: "isotp", name: "ISO-TP" },
    { id: "obd2", name: "OBD-II" },
    { id: "uds", name: "UDS" },
    { id: "kwp2000", name: "KWP2000" },
    { id: "j1939", name: "SAE J1939" },
    { id: "j1708", name: "SAE J1708" },
    { id: "j1587", name: "SAE J1587" },
    { id: "doip", name: "DoIP" },
    { id: "flexray", name: "FlexRay" },
    { id: "ethernet", name: "Automotive Ethernet" },
    { id: "sw-can", name: "Single-Wire CAN" },
    { id: "ft-can", name: "Fault-Tolerant CAN" },
    { id: "tp20", name: "TP2.0" },
  ];
