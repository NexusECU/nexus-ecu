export type EcuSessionLifecycleState =
  | "disconnected"
  | "transport-connected"
  | "ecu-detected"
  | "identified"
  | "active"
  | "timed-out"
  | "error"
  | "closed";

export type EcuSessionLifecycleEvent = {
  id:
    string;

  timestamp:
    string;

  state:
    EcuSessionLifecycleState;

  title:
    string;

  detail:
    string;
};

export type EcuSessionLifecycleSnapshot = {
  state:
    EcuSessionLifecycleState;

  transportConnected:
    boolean;

  ecuResponderDetected:
    boolean;

  identityConfirmed:
    boolean;

  sessionActive:
    boolean;

  lastActivityMs:
    number | null;

  idleMs:
    number | null;

  timeoutThresholdMs:
    number;

  statusText:
    string;
};
