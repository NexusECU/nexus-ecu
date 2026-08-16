import type {
  DtcFreezeFrame,
  DtcRecord,
  DtcSeverity,
  DiagnosticsState,
} from "../../types/ecu";

type FreezeFrameSource = Omit<
  DtcFreezeFrame,
  "timestampMs"
>;

type DtcDefinition = {
  code: string;

  message: string;

  severity: DtcSeverity;
};

const dtcDefinitions:
  Record<string, DtcDefinition> = {
    "HIGH COOLANT TEMPERATURE": {
      code: "P0217",
      message:
        "Engine over-temperature condition",
      severity: "critical",
    },

    "LOW OIL PRESSURE": {
      code: "P0524",
      message:
        "Engine oil pressure too low",
      severity: "critical",
    },

    "LOW BATTERY VOLTAGE": {
      code: "P0562",
      message:
        "System voltage low",
      severity: "warning",
    },

    "BOOST WARNING": {
      code: "P0234-P",
      message:
        "Boost pressure approaching overboost threshold",
      severity: "warning",
    },

    "OVERBOOST CUT": {
      code: "P0234",
      message:
        "Turbocharger overboost condition",
      severity: "critical",
    },

    "KNOCK DETECTED": {
      code: "P0325",
      message:
        "Knock detected by combustion protection",
      severity: "warning",
    },

    "SEVERE KNOCK": {
      code: "P0328",
      message:
        "Severe knock / detonation condition",
      severity: "critical",
    },

    "SENSOR FAULT LIMP MODE": {
      code: "N1000",
      message:
        "Sensor fault fallback requested limp mode",
      severity: "critical",
    },

    "BRAKE BOOST THERMAL PROTECTION": {
      code: "N1101",
      message:
        "Brake boost disabled by thermal protection",
      severity: "warning",
    },

    "ANTI-LAG THERMAL PROTECTION": {
      code: "N1102",
      message:
        "Anti-lag disabled by thermal protection",
      severity: "warning",
    },

    "PIT LIMITER HARD CUT": {
      code: "N1201",
      message:
        "Pit limiter hard-cut intervention",
      severity: "info",
    },
  };

function parseSensorDtc(
  fault: string,
): DtcDefinition | null {
  const match =
    fault.match(
      /^(P\d{4})\s+(.+)$/,
    );

  if (!match) {
    return null;
  }

  return {
    code: match[1],

    message: match[2],

    severity:
      match[1] === "P0520" ||
      match[1] === "P0105" ||
      match[1] === "P0120"
        ? "critical"
        : "warning",
  };
}

function resolveDefinition(
  fault: string,
): DtcDefinition | null {
  const known =
    dtcDefinitions[fault];

  if (known) {
    return known;
  }

  return parseSensorDtc(
    fault,
  );
}

function cloneRecord(
  record: DtcRecord,
): DtcRecord {
  return {
    ...record,

    freezeFrame: {
      ...record.freezeFrame,
    },
  };
}

export class DtcManager {
  private records =
    new Map<
      string,
      DtcRecord
    >();

  private confirmationCounters =
    new Map<
      string,
      number
    >();

  update(
    faults: string[],
    freezeFrame:
      FreezeFrameSource,
    timestampMs: number,
  ): DiagnosticsState {
    const activeDefinitions =
      faults
        .map(
          resolveDefinition,
        )
        .filter(
          (
            item,
          ): item is
            DtcDefinition =>
              item !== null,
        );

    const activeCodes =
      new Set(
        activeDefinitions.map(
          (item) =>
            item.code,
        ),
      );

    for (
      const [
        code,
        record,
      ] of
      this.records.entries()
    ) {
      if (
        !activeCodes.has(
          code,
        )
      ) {
        record.current =
          false;

        record.pending =
          false;

        this.confirmationCounters.set(
          code,
          0,
        );
      }
    }

    for (
      const definition of
      activeDefinitions
    ) {
      const previousCount =
        this.confirmationCounters.get(
          definition.code,
        ) ?? 0;

      const confirmationCount =
        previousCount + 1;

      this.confirmationCounters.set(
        definition.code,
        confirmationCount,
      );

      const existing =
        this.records.get(
          definition.code,
        );

      const confirmed =
        confirmationCount >= 3;

      if (!existing) {
        const newRecord:
          DtcRecord = {
            code:
              definition.code,

            message:
              definition.message,

            severity:
              definition.severity,

            current:
              confirmed,

            pending:
              !confirmed,

            stored:
              confirmed,

            occurrences: 1,

            firstSeenMs:
              timestampMs,

            lastSeenMs:
              timestampMs,

            freezeFrame: {
              ...freezeFrame,

              timestampMs,
            },
          };

        this.records.set(
          definition.code,
          newRecord,
        );

        continue;
      }

      const wasActive =
        existing.current ||
        existing.pending;

      existing.message =
        definition.message;

      existing.severity =
        definition.severity;

      existing.current =
        confirmed;

      existing.pending =
        !confirmed;

      existing.stored =
        existing.stored ||
        confirmed;

      existing.lastSeenMs =
        timestampMs;

      if (!wasActive) {
        existing.occurrences +=
          1;

        existing.freezeFrame = {
          ...freezeFrame,

          timestampMs,
        };
      }
    }

    return this.getState();
  }

  clear(): void {
    this.records.clear();

    this.confirmationCounters.clear();
  }

  getState():
    DiagnosticsState {
    const all =
      [...this.records.values()]
        .map(
          cloneRecord,
        )
        .sort(
          (a, b) =>
            b.lastSeenMs -
            a.lastSeenMs,
        );

    const current =
      all.filter(
        (record) =>
          record.current,
      );

    const pending =
      all.filter(
        (record) =>
          record.pending,
      );

    const stored =
      all.filter(
        (record) =>
          record.stored,
      );

    return {
      milActive:
        current.some(
          (record) =>
            record.severity !==
            "info",
        ),

      current,

      pending,

      stored,

      all,
    };
  }
}
