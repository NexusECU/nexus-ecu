import type {
  CanFrame,
} from "./canParser";

export type IsoTpMessage = {
  canId: number;
  timestampMs: number;
  payload: number[];
};

type PendingIsoTp = {
  expectedLength: number;
  payload: number[];
  nextSequence: number;
  timestampMs: number;
};

export function reassembleIsoTp(
  frames: CanFrame[],
): IsoTpMessage[] {
  const pending =
    new Map<number, PendingIsoTp>();

  const messages:
    IsoTpMessage[] = [];

  for (const frame of frames) {
    if (
      frame.remote ||
      frame.data.length === 0
    ) {
      continue;
    }

    const pci =
      frame.data[0];

    const frameType =
      (pci >> 4) &
      0x0f;

    if (frameType === 0x0) {
      const length =
        pci &
        0x0f;

      if (
        length <= 0 ||
        frame.data.length <
        length + 1
      ) {
        continue;
      }

      messages.push({
        canId:
          frame.id,

        timestampMs:
          frame.timestampMs,

        payload:
          frame.data.slice(
            1,
            1 + length,
          ),
      });

      continue;
    }

    if (frameType === 0x1) {
      if (
        frame.data.length <
        2
      ) {
        continue;
      }

      const expectedLength =
        (
          (
            pci &
            0x0f
          ) <<
          8
        ) |
        frame.data[1];

      const payload =
        frame.data.slice(
          2,
        );

      pending.set(
        frame.id,
        {
          expectedLength,
          payload,
          nextSequence:
            1,
          timestampMs:
            frame.timestampMs,
        },
      );

      if (
        payload.length >=
        expectedLength
      ) {
        messages.push({
          canId:
            frame.id,

          timestampMs:
            frame.timestampMs,

          payload:
            payload.slice(
              0,
              expectedLength,
            ),
        });

        pending.delete(
          frame.id,
        );
      }

      continue;
    }

    if (frameType === 0x2) {
      const current =
        pending.get(
          frame.id,
        );

      if (!current) {
        continue;
      }

      const sequence =
        pci &
        0x0f;

      if (
        sequence !==
        (
          current.nextSequence &
          0x0f
        )
      ) {
        pending.delete(
          frame.id,
        );

        continue;
      }

      current.payload.push(
        ...frame.data.slice(
          1,
        ),
      );

      current.nextSequence =
        (
          current.nextSequence +
          1
        ) &
        0x0f;

      if (
        current.payload.length >=
        current.expectedLength
      ) {
        messages.push({
          canId:
            frame.id,

          timestampMs:
            frame.timestampMs,

          payload:
            current.payload.slice(
              0,
              current.expectedLength,
            ),
        });

        pending.delete(
          frame.id,
        );
      }

      continue;
    }
  }

  return messages;
}
