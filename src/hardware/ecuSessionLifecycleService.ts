import type {
  EcuSessionLifecycleSnapshot,
} from "./ecuSessionLifecycleTypes";

export function buildEcuSessionLifecycleSnapshot(
  transportConnected:
    boolean,
  ecuResponderDetected:
    boolean,
  identityConfirmed:
    boolean,
  sessionStarted:
    boolean,
  manuallyClosed:
    boolean,
  lastActivityMs:
    number | null,
  currentTimeMs:
    number,
  error:
    string | null,
  timeoutThresholdMs:
    number = 15000,
): EcuSessionLifecycleSnapshot {
  const idleMs =
    lastActivityMs === null
      ? null
      : Math.max(
          0,
          currentTimeMs -
            lastActivityMs,
        );

  if (error) {
    return {
      state:
        "error",

      transportConnected,

      ecuResponderDetected,

      identityConfirmed,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        error,
    };
  }

  if (manuallyClosed) {
    return {
      state:
        "closed",

      transportConnected,

      ecuResponderDetected,

      identityConfirmed,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        "Session closed by user.",
    };
  }

  if (!transportConnected) {
    return {
      state:
        "disconnected",

      transportConnected:
        false,

      ecuResponderDetected:
        false,

      identityConfirmed:
        false,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        "Transport is not connected.",
    };
  }

  if (
    sessionStarted &&
    idleMs !== null &&
    idleMs >
      timeoutThresholdMs
  ) {
    return {
      state:
        "timed-out",

      transportConnected,

      ecuResponderDetected,

      identityConfirmed,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        `Session idle for ${Math.round(
          idleMs / 1000,
        )} seconds.`,
    };
  }

  if (!ecuResponderDetected) {
    return {
      state:
        "transport-connected",

      transportConnected,

      ecuResponderDetected:
        false,

      identityConfirmed:
        false,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        "Transport connected; waiting for ECU responder evidence.",
    };
  }

  if (!identityConfirmed) {
    return {
      state:
        "ecu-detected",

      transportConnected,

      ecuResponderDetected,

      identityConfirmed:
        false,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        "ECU responder detected; identity is incomplete.",
    };
  }

  if (!sessionStarted) {
    return {
      state:
        "identified",

      transportConnected,

      ecuResponderDetected,

      identityConfirmed,

      sessionActive:
        false,

      lastActivityMs,

      idleMs,

      timeoutThresholdMs,

      statusText:
        "ECU identity confirmed; read-only session can be started.",
    };
  }

  return {
    state:
      "active",

    transportConnected,

    ecuResponderDetected,

    identityConfirmed,

    sessionActive:
      true,

    lastActivityMs,

    idleMs,

    timeoutThresholdMs,

    statusText:
      "Read-only ECU session is active.",
  };
}
