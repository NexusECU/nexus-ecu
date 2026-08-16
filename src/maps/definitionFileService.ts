import type {
  NexusDefinitionFile,
} from "./definitionFileTypes";

import {
  NEXUS_DEFINITION_SCHEMA,
} from "./definitionFileTypes";

function validateDefinitionFile(
  value: unknown,
): NexusDefinitionFile {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "This is not a valid NEXUS definition file.",
    );
  }

  const candidate =
    value as Partial<NexusDefinitionFile>;

  if (
    candidate.schemaVersion !==
      NEXUS_DEFINITION_SCHEMA ||
    typeof candidate.id !==
      "string" ||
    typeof candidate.name !==
      "string" ||
    !Array.isArray(
      candidate.definitions,
    )
  ) {
    throw new Error(
      "The definition file is invalid or unsupported.",
    );
  }

  return candidate as NexusDefinitionFile;
}

export function parseDefinitionFile(
  text: string,
): NexusDefinitionFile {
  return validateDefinitionFile(
    JSON.parse(
      text,
    ),
  );
}

export function serialiseDefinitionFile(
  file:
    NexusDefinitionFile,
): string {
  return JSON.stringify(
    file,
    null,
    2,
  );
}
