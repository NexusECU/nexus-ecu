export type TransportProviderId =
  | "raw-serial"
  | "slcan"
  | "elm-obd"
  | "j2534"
  | "pcan"
  | "kvaser"
  | "vector-xl"
  | "socketcan"
  | "doip"
  | "generic-ethernet";

export type VehicleProtocol =
  | "raw-serial"
  | "can"
  | "can-fd"
  | "can-xl"
  | "lin"
  | "isotp"
  | "obd2"
  | "uds"
  | "kwp2000"
  | "j1939"
  | "j1708"
  | "j1587"
  | "doip"
  | "flexray"
  | "ethernet"
  | "sw-can"
  | "ft-can"
  | "tp20";

export type ProviderAvailability =
  | "implemented"
  | "bridge-required"
  | "platform-required"
  | "planned";

export type TransportCapability = {
  protocol: VehicleProtocol;

  read: boolean;

  write: boolean;

  notes?: string;
};

export type TransportProvider = {
  id: TransportProviderId;

  name: string;

  shortName: string;

  description: string;

  platforms: string[];

  availability:
    ProviderAvailability;

  requiresVendorSdk: boolean;

  sdkName:
    string | null;

  capabilities:
    TransportCapability[];
};

export type UniversalTransportSelection = {
  providerId:
    TransportProviderId;

  protocol:
    VehicleProtocol;
};
