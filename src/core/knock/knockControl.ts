export interface KnockControlInput {
  engineRunning: boolean;

  rpm: number;

  engineLoad: number;

  boostKpa: number;

  intakeAirTemperatureC: number;

  coolantTemperatureC: number;

  ignitionTimingDegrees: number;

  sensitivity?: number;
}

export interface KnockControlResult {
  active: boolean;

  knockDetected: boolean;

  severeKnock: boolean;

  knockLevel: number;

  ignitionRetardDegrees: number;

  knockCount: number;
}

export function calculateKnockControl(
  input: KnockControlInput,
): KnockControlResult {
  if (!input.engineRunning) {
    return {
      active: false,
      knockDetected: false,
      severeKnock: false,
      knockLevel: 0,
      ignitionRetardDegrees: 0,
      knockCount: 0,
    };
  }

  const sensitivity =
    Math.max(
      0.5,
      Math.min(
        2,
        input.sensitivity ??
          1,
      ),
    );

  const rpmFactor =
    Math.max(
      0,
      Math.min(
        1,
        (
          input.rpm -
          2500
        ) /
          4500,
      ),
    );

  const loadFactor =
    Math.max(
      0,
      Math.min(
        1,
        input.engineLoad,
      ),
    );

  const boostFactor =
    Math.max(
      0,
      Math.min(
        1,
        input.boostKpa /
          220,
      ),
    );

  const iatFactor =
    Math.max(
      0,
      Math.min(
        1,
        (
          input.intakeAirTemperatureC -
          35
        ) /
          45,
      ),
    );

  const coolantFactor =
    Math.max(
      0,
      Math.min(
        1,
        (
          input.coolantTemperatureC -
          90
        ) /
          25,
      ),
    );

  const timingFactor =
    Math.max(
      0,
      Math.min(
        1,
        (
          input.ignitionTimingDegrees -
          18
        ) /
          20,
      ),
    );

  const rawKnockRisk =
    (
      rpmFactor *
        0.15 +
      loadFactor *
        0.28 +
      boostFactor *
        0.24 +
      iatFactor *
        0.12 +
      coolantFactor *
        0.1 +
      timingFactor *
        0.11
    ) *
    sensitivity;

  /*
   * Small deterministic oscillation keeps the
   * simulation dynamic without Math.random().
   */
  const oscillation =
    (
      Math.sin(
        input.rpm /
          173,
      ) +
      1
    ) *
    0.035;

  const knockRisk =
    Math.max(
      0,
      Math.min(
        1,
        rawKnockRisk +
          oscillation,
      ),
    );

  const knockDetected =
    knockRisk >=
    0.62;

  const severeKnock =
    knockRisk >=
    0.84;

  const knockLevel =
    knockDetected
      ? Math.min(
          100,
          (
            knockRisk -
            0.55
          ) /
            0.45 *
            100,
        )
      : 0;

  const ignitionRetardDegrees =
    severeKnock
      ? Math.min(
          14,
          8 +
            knockLevel *
              0.06,
        )
      : knockDetected
        ? Math.min(
            8,
            2 +
              knockLevel *
                0.05,
          )
        : 0;

  return {
    active:
      knockDetected,

    knockDetected,

    severeKnock,

    knockLevel,

    ignitionRetardDegrees,

    knockCount:
      knockDetected
        ? 1
        : 0,
  };
}
