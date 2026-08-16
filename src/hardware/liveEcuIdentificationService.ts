import type {
  CanFrame,
} from "./canParser";

import {
  parseMode09Payloads,
} from "./ecuIdentificationService";

import {
  reassembleIsoTp,
} from "./passiveIsoTp";

import type {
  EcuIdentification,
} from "./ecuIdentificationTypes";

export type LiveEcuIdentification = {
  identity: EcuIdentification;
  responderIds: string[];
  mode09MessageCount: number;
  evidence: string[];
};

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

export function decodeLiveEcuIdentification(
  frames: CanFrame[],
): LiveEcuIdentification {
  const messages =
    reassembleIsoTp(
      frames,
    );

  const mode09 =
    messages.filter(
      message =>
        message.payload.length >=
          2 &&
        message.payload[0] ===
          0x49,
    );

  const identity =
    parseMode09Payloads(
      mode09.map(
        message =>
          message.payload,
      ),
    );

  const responderIds =
    Array.from(
      new Set(
        mode09.map(
          message =>
            idHex(
              message.canId,
            ),
        ),
      ),
    );

  const evidence = [
    ...identity.evidence,
  ];

  if (
    mode09.length >
    0
  ) {
    evidence.push(
      `${mode09.length} passive Mode 09 ISO-TP response message(s) decoded`,
    );
  }

  if (
    responderIds.length >
    0
  ) {
    evidence.push(
      `Mode 09 responder(s): ${responderIds.join(" · ")}`,
    );
  }

  return {
    identity,
    responderIds,
    mode09MessageCount:
      mode09.length,
    evidence:
      Array.from(
        new Set(
          evidence,
        ),
      ),
  };
}
