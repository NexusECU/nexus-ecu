export type RomImageInfo = {
  fileName: string;

  sizeBytes: number;

  sha256: string;

  loadedAt: string;

  bytes: Uint8Array;
};

export type RomScalarBinding = {
  definitionId: string;

  address: number;

  dataType: string;

  unit: string;

  originalValue:
    number | boolean | null;

  currentValue:
    number | boolean | null;

  valid: boolean;

  error:
    string | null;
};
