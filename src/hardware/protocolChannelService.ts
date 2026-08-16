import type {
  CanFrame,
} from "./canParser";

import type {
  TransportProviderId,
} from "./transportTypes";

import type {
  AddressingMode,
  ProtocolChannelSnapshot,
  ProtocolFamily,
} from "./protocolChannelTypes";

function idHex(
  id: number,
): string {
  return `0x${id
    .toString(16)
    .toUpperCase()
    .padStart(
      id > 0x7ff
        ? 8
        : 3,
      "0",
    )}`;
}

function protocolFamilyForProvider(
  providerId:
    TransportProviderId,
): ProtocolFamily {
  switch (
    providerId
  ) {
    case "j2534":
      return "j2534";

    case "elm-obd":
      return "elm";

    case "slcan":
      return "can";

    case "raw-serial":
      return "serial";

    default:
      return "unknown";
  }
}

function addressingMode(
  frames:
    CanFrame[],
): AddressingMode {
  if (
    frames.length ===
    0
  ) {
    return "unknown";
  }

  const hasStandard =
    frames.some(
      frame =>
        !frame.extended,
    );

  const hasExtended =
    frames.some(
      frame =>
        frame.extended,
    );

  if (
    hasStandard &&
    hasExtended
  ) {
    return "mixed";
  }

  if (hasExtended) {
    return "29-bit";
  }

  return "11-bit";
}

export function buildProtocolChannelSnapshot(
  providerId:
    TransportProviderId,
  transportConnected:
    boolean,
  channelRequestedOpen:
    boolean,
  frames:
    CanFrame[],
  bitrateKbps:
    number | null,
  error:
    string | null,
): ProtocolChannelSnapshot {
  const responders =
    Array.from(
      new Set(
        frames
          .map(
            frame =>
              frame.id,
          )
          .filter(
            id =>
              id >= 0x7e8 &&
              id <= 0x7ef,
          ),
      ),
    ).map(
      idHex,
    );

  const family =
    protocolFamilyForProvider(
      providerId,
    );

  const addressMode =
    addressingMode(
      frames,
    );

  if (error) {
    return {
      providerId,
      protocolFamily:
        family,
      addressingMode:
        addressMode,
      state:
        "error",
      bitrateKbps,
      responderIds:
        responders,
      frameCount:
        frames.length,
      ready:
        false,
      statusText:
        error,
    };
  }

  if (
    !transportConnected ||
    !channelRequestedOpen
  ) {
    return {
      providerId,
      protocolFamily:
        family,
      addressingMode:
        addressMode,
      state:
        "closed",
      bitrateKbps,
      responderIds:
        responders,
      frameCount:
        frames.length,
      ready:
        false,
      statusText:
        !transportConnected
          ? "Transport is disconnected."
          : "Protocol channel is closed.",
    };
  }

  if (
    frames.length ===
    0
  ) {
    return {
      providerId,
      protocolFamily:
        family,
      addressingMode:
        addressMode,
      state:
        "degraded",
      bitrateKbps,
      responderIds:
        responders,
      frameCount:
        0,
      ready:
        false,
      statusText:
        "Channel is open but no bus traffic has been observed.",
    };
  }

  return {
    providerId,
    protocolFamily:
      family,
    addressingMode:
      addressMode,
    state:
      "open",
    bitrateKbps,
    responderIds:
      responders,
    frameCount:
      frames.length,
    ready:
      true,
    statusText:
      responders.length
        ? `Channel open · ${responders.length} diagnostic responder(s) observed.`
        : "Channel open · vehicle network traffic observed.",
  };
}
