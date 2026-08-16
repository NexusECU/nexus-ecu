export type TestBenchScenarioId =
  | "idle-warmup"
  | "street-pull"
  | "wot-pull"
  | "launch-test"
  | "sensor-fault-test";

export interface TestBenchScenario {
  id: TestBenchScenarioId;

  name: string;

  description: string;

  durationSeconds: number;
}

export interface TestBenchState {
  running: boolean;

  scenarioId:
    | TestBenchScenarioId
    | null;

  scenarioName: string;

  elapsedSeconds: number;

  durationSeconds: number;

  progressPercent: number;

  status: string;

  completedRuns: number;
}

export const testBenchScenarios:
  TestBenchScenario[] = [
    {
      id: "idle-warmup",
      name: "Idle Warm-Up",
      description:
        "Starts the engine and holds a stable idle/light-throttle warm-up cycle.",
      durationSeconds: 20,
    },

    {
      id: "street-pull",
      name: "Street Acceleration",
      description:
        "Progressive street-mode throttle sweep for drivability and torque response.",
      durationSeconds: 14,
    },

    {
      id: "wot-pull",
      name: "Full-Throttle Pull",
      description:
        "Sport-mode ramp into full throttle for boost, AFR, torque and dyno testing.",
      durationSeconds: 12,
    },

    {
      id: "launch-test",
      name: "Launch Test",
      description:
        "Drag-mode launch-control test followed by a controlled acceleration release.",
      durationSeconds: 10,
    },

    {
      id: "sensor-fault-test",
      name: "MAP Fault Test",
      description:
        "Injects a MAP sensor fault, verifies fallback/DTC behavior, then restores it.",
      durationSeconds: 12,
    },
  ];

export const createInitialTestBenchState =
  (): TestBenchState => ({
    running: false,

    scenarioId: null,

    scenarioName: "READY",

    elapsedSeconds: 0,

    durationSeconds: 0,

    progressPercent: 0,

    status: "READY",

    completedRuns: 0,
  });

export function getTestBenchScenario(
  id: TestBenchScenarioId,
): TestBenchScenario | undefined {
  return testBenchScenarios.find(
    (scenario) =>
      scenario.id === id,
  );
}
