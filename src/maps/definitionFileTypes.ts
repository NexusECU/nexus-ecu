import type {
  CalibrationDefinition,
} from "./calibrationDefinitionTypes";

export const NEXUS_DEFINITION_SCHEMA =
  1;

export type NexusDefinitionFile = {
  schemaVersion: number;

  id: string;

  name: string;

  vendor: string;

  ecuFamily: string;

  romId: string;

  description: string;

  createdAt: string;

  updatedAt: string;

  definitions:
    CalibrationDefinition[];
};
