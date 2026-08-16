import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  DefinitionProfile,
} from "./definitionDatabaseTypes";

export function buildLocalDefinitionProfiles(
  builtInDefinitions:
    CalibrationDefinition[],
): DefinitionProfile[] {
  return [
    {
      id:
        "nexus-development",

      name:
        "NEXUS Development ECU",

      vendor:
        "NEXUS",

      ecuFamily:
        "Development ECU",

      romId:
        "NEXUS-DEMO-001",

      description:
        "Built-in NEXUS development ROM profile.",

      expectedSizeBytes:
        null,

      sha256Prefix:
        null,

      definitions:
        builtInDefinitions,
    },
  ];
}
