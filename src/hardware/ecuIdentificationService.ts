import type {
  IdentificationRequest,
  EcuIdentification,
} from "./ecuIdentificationTypes";

export const STANDARD_MODE09_REQUESTS: IdentificationRequest[] = [
  {
    service: 0x09,
    pid: 0x00,
    label: "Supported vehicle-information PIDs",
    commandHex: "0900",
    readOnly: true,
  },
  {
    service: 0x09,
    pid: 0x02,
    label: "VIN",
    commandHex: "0902",
    readOnly: true,
  },
  {
    service: 0x09,
    pid: 0x04,
    label: "Calibration ID",
    commandHex: "0904",
    readOnly: true,
  },
  {
    service: 0x09,
    pid: 0x06,
    label: "Calibration Verification Number",
    commandHex: "0906",
    readOnly: true,
  },
  {
    service: 0x09,
    pid: 0x0a,
    label: "ECU name",
    commandHex: "090A",
    readOnly: true,
  },
];

function printableAscii(
  bytes: number[],
): string {
  return bytes
    .filter(
      value =>
        value >= 0x20 &&
        value <= 0x7e,
    )
    .map(
      value =>
        String.fromCharCode(value),
    )
    .join("")
    .trim();
}

export function parseMode09Payloads(
  payloads: number[][],
): EcuIdentification {
  const result: EcuIdentification = {
    vin: null,
    calibrationIds: [],
    cvns: [],
    ecuNames: [],
    supportedMode09Pids: [],
    evidence: [],
  };

  for (const payload of payloads) {
    if (
      payload.length < 2 ||
      payload[0] !== 0x49
    ) {
      continue;
    }

    const pid = payload[1];

    if (
      pid === 0x00 &&
      payload.length >= 6
    ) {
      const mask =
        (
          payload[2] * 0x1000000 +
          payload[3] * 0x10000 +
          payload[4] * 0x100 +
          payload[5]
        ) >>> 0;

      for (
        let bit = 0;
        bit < 32;
        bit++
      ) {
        if (
          mask &
          (1 << (31 - bit))
        ) {
          result.supportedMode09Pids.push(
            bit + 1,
          );
        }
      }

      result.evidence.push(
        "Mode 09 supported-PID response received",
      );
    }

    if (pid === 0x02) {
      const text =
        printableAscii(
          payload.slice(2),
        );

      const match =
        text.match(
          /[A-HJ-NPR-Z0-9]{17}/,
        );

      if (match) {
        result.vin =
          match[0];

        result.evidence.push(
          "VIN response received",
        );
      }
    }

    if (pid === 0x04) {
      const text =
        printableAscii(
          payload.slice(2),
        );

      if (text) {
        result.calibrationIds.push(
          text,
        );

        result.evidence.push(
          "Calibration ID response received",
        );
      }
    }

    if (pid === 0x06) {
      const cvn =
        payload
          .slice(2)
          .map(
            value =>
              value
                .toString(16)
                .padStart(2, "0")
                .toUpperCase(),
          )
          .join("");

      if (cvn) {
        result.cvns.push(
          cvn,
        );

        result.evidence.push(
          "CVN response received",
        );
      }
    }

    if (pid === 0x0a) {
      const text =
        printableAscii(
          payload.slice(2),
        );

      if (text) {
        result.ecuNames.push(
          text,
        );

        result.evidence.push(
          "ECU name response received",
        );
      }
    }
  }

  result.calibrationIds =
    Array.from(
      new Set(
        result.calibrationIds,
      ),
    );

  result.cvns =
    Array.from(
      new Set(
        result.cvns,
      ),
    );

  result.ecuNames =
    Array.from(
      new Set(
        result.ecuNames,
      ),
    );

  result.evidence =
    Array.from(
      new Set(
        result.evidence,
      ),
    );

  return result;
}
