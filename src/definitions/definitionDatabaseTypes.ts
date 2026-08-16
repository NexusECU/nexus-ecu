import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

export type RomFingerprint = {
  sizeBytes: number;

  sha256Prefix: string;

  entropyEstimate: number;

  zeroByteRatio: number;

  ffByteRatio: number;
};

export type DefinitionProfile = {
  id: string;

  name: string;

  vendor: string;

  ecuFamily: string;

  romId: string;

  description: string;

  expectedSizeBytes:
    number | null;

  sha256Prefix:
    string | null;

  definitions:
    CalibrationDefinition[];
};

export type DefinitionMatch = {
  profileId: string;

  score: number;

  reasons: string[];
};

export type CandidateMap = {
  id: string;

  offset: number;

  dataType:
    "uint8" |
    "uint16" |
    "int16";

  endian:
    "little" |
    "big";

  rows: number;

  columns: number;

  score: number;

  min: number;

  max: number;

  average: number;

  smoothness: number;

  reason: string;
};
