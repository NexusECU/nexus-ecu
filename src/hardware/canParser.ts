export type CanFrame = {
  timestampMs: number;

  id: number;

  idHex: string;

  extended: boolean;

  remote: boolean;

  dlc: number;

  data: number[];

  raw: string;
};

function isHex(
  value: string,
): boolean {
  return /^[0-9A-Fa-f]+$/.test(
    value,
  );
}

export function parseSlcanLine(
  line: string,
  timestampMs:
    number = Date.now(),
): CanFrame | null {
  if (
    line.length < 5
  ) {
    return null;
  }

  const type =
    line[0];

  const extended =
    type === "T" ||
    type === "R";

  const remote =
    type === "r" ||
    type === "R";

  if (
    ![
      "t",
      "T",
      "r",
      "R",
    ].includes(
      type,
    )
  ) {
    return null;
  }

  const idLength =
    extended
      ? 8
      : 3;

  const idText =
    line.slice(
      1,
      1 + idLength,
    );

  const dlcText =
    line.slice(
      1 + idLength,
      2 + idLength,
    );

  if (
    !isHex(
      idText,
    ) ||
    !isHex(
      dlcText,
    )
  ) {
    return null;
  }

  const id =
    Number.parseInt(
      idText,
      16,
    );

  const dlc =
    Number.parseInt(
      dlcText,
      16,
    );

  if (
    dlc < 0 ||
    dlc > 8
  ) {
    return null;
  }

  const payloadStart =
    2 +
    idLength;

  const payloadChars =
    remote
      ? 0
      : dlc * 2;

  if (
    line.length <
    payloadStart +
      payloadChars
  ) {
    return null;
  }

  const payloadText =
    line.slice(
      payloadStart,
      payloadStart +
        payloadChars,
    );

  if (
    payloadText &&
    !isHex(
      payloadText,
    )
  ) {
    return null;
  }

  const data:
    number[] = [];

  for (
    let index = 0;
    index <
    payloadText.length;
    index += 2
  ) {
    data.push(
      Number.parseInt(
        payloadText.slice(
          index,
          index + 2,
        ),
        16,
      ),
    );
  }

  return {
    timestampMs,

    id,

    idHex:
      id.toString(
        16,
      )
      .toUpperCase()
      .padStart(
        idLength,
        "0",
      ),

    extended,

    remote,

    dlc,

    data,

    raw:
      line,
  };
}

export function extractSlcanFrames(
  text: string,
  timestampMs:
    number = Date.now(),
): {
  frames: CanFrame[];

  remainder: string;
} {
  const parts =
    text.split(
      "\r",
    );

  const remainder =
    parts.pop() ??
    "";

  const frames =
    parts
      .map(
        (part) =>
          parseSlcanLine(
            part.trim(),
            timestampMs,
          ),
      )
      .filter(
        (
          frame,
        ): frame is CanFrame =>
          frame !==
          null,
      );

  return {
    frames,
    remainder,
  };
}
