export type J2534Device = {
  name: string;

  vendor: string | null;

  functionLibrary: string;

  configApplication:
    string | null;

  registryPath: string;

  architecture:
    "32-bit" | "64-bit" | "unknown";

  dllLoadable: boolean;

  hasPassThruOpen: boolean;

  hasPassThruClose: boolean;

  hasPassThruConnect: boolean;

  hasPassThruDisconnect: boolean;

  hasPassThruReadMsgs: boolean;

  hasPassThruWriteMsgs: boolean;

  error:
    string | null;
};


export type J2534Connection = {
  connected: boolean;

  deviceId:
    number | null;

  deviceName:
    string | null;

  vendor:
    string | null;

  functionLibrary:
    string | null;

  openedAt:
    string | null;

  lastErrorCode:
    number | null;

  status:
    string;
};
