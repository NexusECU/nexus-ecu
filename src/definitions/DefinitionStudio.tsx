import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FilePlus2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CalibrationDefinition,
  CalibrationItemType,
} from "../maps/calibrationDefinitionTypes";

import type {
  NexusDefinitionFile,
} from "../maps/definitionFileTypes";

import {
  NEXUS_DEFINITION_SCHEMA,
} from "../maps/definitionFileTypes";

import {
  serialiseDefinitionFile,
} from "../maps/definitionFileService";

import {
  validateDefinitions,
} from "./definitionValidation";

import "./definition-studio.css";

type Props = {
  activeFile:
    NexusDefinitionFile | null;

  builtInDefinitions:
    CalibrationDefinition[];

  onFileChange: (
    file:
      NexusDefinitionFile,
  ) => void;
};

function cloneDefinition(
  definition:
    CalibrationDefinition,
): CalibrationDefinition {
  return JSON.parse(
    JSON.stringify(
      definition,
    ),
  ) as CalibrationDefinition;
}

function createDefaultDefinition(
  index: number,
): CalibrationDefinition {
  return {
    id:
      `new-item-${index}`,

    name:
      `New Calibration Item ${index}`,

    category:
      "Miscellaneous",

    type:
      "scalar",

    mapKind:
      null,

    description:
      "",

    unit:
      "",

    address:
      "0x000000",

    dataType:
      "uint16",

    readOnly:
      false,

    value:
      0,

    binary: {
      address:
        "0x000000",

      dataType:
        "uint16",

      endian:
        "little",

      scale: {
        multiplier:
          1,

        offset:
          0,
      },
    },
  };
}

function createWorkingFile(
  activeFile:
    NexusDefinitionFile | null,
  builtInDefinitions:
    CalibrationDefinition[],
): NexusDefinitionFile {
  if (
    activeFile
  ) {
    return JSON.parse(
      JSON.stringify(
        activeFile,
      ),
    ) as NexusDefinitionFile;
  }

  const now =
    new Date()
      .toISOString();

  return {
    schemaVersion:
      NEXUS_DEFINITION_SCHEMA,

    id:
      "nexus-definition",

    name:
      "NEXUS Definition",

    vendor:
      "NEXUS",

    ecuFamily:
      "Development ECU",

    romId:
      "UNKNOWN",

    description:
      "",

    createdAt:
      now,

    updatedAt:
      now,

    definitions:
      builtInDefinitions.map(
        cloneDefinition,
      ),
  };
}

export function DefinitionStudio({
  activeFile,
  builtInDefinitions,
  onFileChange,
}: Props) {
  const [
    workingFile,
    setWorkingFile,
  ] = useState<
    NexusDefinitionFile
  >(
    () =>
      createWorkingFile(
        activeFile,
        builtInDefinitions,
      ),
  );

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    string | null
  >(
    workingFile.definitions[0]
      ?.id ??
    null,
  );

  useEffect(
    () => {
      const next =
        createWorkingFile(
          activeFile,
          builtInDefinitions,
        );

      setWorkingFile(
        next,
      );

      setSelectedId(
        next.definitions[0]
          ?.id ??
        null,
      );
    },
    [
      activeFile,
    ],
  );

  const selected =
    workingFile.definitions.find(
      (definition) =>
        definition.id ===
        selectedId,
    ) ??
    null;

  const issues =
    useMemo(
      () =>
        validateDefinitions(
          workingFile.definitions,
        ),
      [
        workingFile.definitions,
      ],
    );

  const errors =
    issues.filter(
      (issue) =>
        issue.severity ===
        "error",
    );

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity ===
        "warning",
    );

  const patchFile =
    (
      patch:
        Partial<NexusDefinitionFile>,
    ) => {
      setWorkingFile(
        (previous) => ({
          ...previous,
          ...patch,
          updatedAt:
            new Date()
              .toISOString(),
        }),
      );
    };

  const patchSelected =
    (
      patch:
        Partial<CalibrationDefinition>,
    ) => {
      if (
        !selected
      ) {
        return;
      }

      setWorkingFile(
        (previous) => ({
          ...previous,
          updatedAt:
            new Date()
              .toISOString(),

          definitions:
            previous.definitions.map(
              (definition) =>
                definition.id ===
                selected.id
                  ? {
                      ...definition,
                      ...patch,
                    }
                  : definition,
            ),
        }),
      );
    };

  const patchBinary =
    (
      patch:
        Partial<
          NonNullable<
            CalibrationDefinition[
              "binary"
            ]
          >
        >,
    ) => {
      if (
        !selected
      ) {
        return;
      }

      const current =
        selected.binary ?? {
          address:
            selected.address,

          dataType:
            selected.dataType,

          endian:
            "little" as const,

          scale: {
            multiplier:
              1,

            offset:
              0,
          },
        };

      patchSelected({
        binary: {
          ...current,
          ...patch,
        },
      });
    };

  const addDefinition =
    () => {
      const next =
        createDefaultDefinition(
          workingFile.definitions.length +
            1,
        );

      patchFile({
        definitions: [
          ...workingFile.definitions,
          next,
        ],
      });

      setSelectedId(
        next.id,
      );
    };

  const duplicateSelected =
    () => {
      if (
        !selected
      ) {
        return;
      }

      const copy =
        cloneDefinition(
          selected,
        );

      copy.id =
        `${selected.id}-copy`;

      copy.name =
        `${selected.name} Copy`;

      patchFile({
        definitions: [
          ...workingFile.definitions,
          copy,
        ],
      });

      setSelectedId(
        copy.id,
      );
    };

  const deleteSelected =
    () => {
      if (
        !selected
      ) {
        return;
      }

      const remaining =
        workingFile.definitions.filter(
          (definition) =>
            definition.id !==
            selected.id,
        );

      patchFile({
        definitions:
          remaining,
      });

      setSelectedId(
        remaining[0]
          ?.id ??
        null,
      );
    };

  const applyWorkingFile =
    () => {
      onFileChange({
        ...workingFile,
        updatedAt:
          new Date()
            .toISOString(),
      });
    };

  const exportWorkingFile =
    () => {
      const blob =
        new Blob(
          [
            serialiseDefinitionFile(
              workingFile,
            ),
          ],
          {
            type:
              "application/json",
          },
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const anchor =
        document.createElement(
          "a",
        );

      anchor.href =
        url;

      anchor.download =
        `${workingFile.id}.nexusdef.json`;

      anchor.click();

      URL.revokeObjectURL(
        url,
      );
    };

  return (
    <section className="definition-studio">
      <div className="definition-studio-header">
        <div>
          <FilePlus2
            size={15}
          />

          <div>
            <span className="eyebrow">
              DEFINITION STUDIO
            </span>

            <h3>
              ECU Definition Editor
            </h3>
          </div>
        </div>

        <div
          className={`definition-studio-health ${
            errors.length >
            0
              ? "error"
              : warnings.length >
                0
                ? "warning"
                : "ok"
          }`}
        >
          {errors.length >
          0 ? (
            <AlertTriangle
              size={13}
            />
          ) : (
            <CheckCircle2
              size={13}
            />
          )}

          {errors.length}
          {""}
          ERRORS ·
          {""}
          {warnings.length}
          {""}
          WARNINGS
        </div>
      </div>

      <div className="definition-studio-file-meta">
        <label>
          <span>
            NAME
          </span>

          <input
            value={
              workingFile.name
            }
            onChange={(event) =>
              patchFile({
                name:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          <span>
            VENDOR
          </span>

          <input
            value={
              workingFile.vendor
            }
            onChange={(event) =>
              patchFile({
                vendor:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          <span>
            ECU FAMILY
          </span>

          <input
            value={
              workingFile.ecuFamily
            }
            onChange={(event) =>
              patchFile({
                ecuFamily:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          <span>
            ROM ID
          </span>

          <input
            value={
              workingFile.romId
            }
            onChange={(event) =>
              patchFile({
                romId:
                  event.target.value,
              })
            }
          />
        </label>
      </div>

      <div className="definition-studio-toolbar">
        <button
          type="button"
          onClick={
            addDefinition
          }
        >
          <Plus
            size={12}
          />

          ADD ITEM
        </button>

        <button
          type="button"
          disabled={
            !selected
          }
          onClick={
            duplicateSelected
          }
        >
          <Copy
            size={12}
          />

          DUPLICATE
        </button>

        <button
          type="button"
          disabled={
            !selected
          }
          onClick={
            deleteSelected
          }
        >
          <Trash2
            size={12}
          />

          DELETE
        </button>

        <span />

        <button
          type="button"
          onClick={
            applyWorkingFile
          }
        >
          <Save
            size={12}
          />

          APPLY DEFINITION
        </button>

        <button
          type="button"
          onClick={
            exportWorkingFile
          }
        >
          <Save
            size={12}
          />

          EXPORT
        </button>
      </div>

      <div className="definition-studio-body">
        <div className="definition-studio-list">
          {workingFile.definitions.map(
            (definition) => (
              <button
                type="button"
                key={
                  definition.id
                }
                className={
                  definition.id ===
                  selectedId
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedId(
                    definition.id,
                  )
                }
              >
                <strong>
                  {definition.name}
                </strong>

                <span>
                  {definition.type}
                  {" · "}
                  {definition.address}
                </span>
              </button>
            ),
          )}
        </div>

        <div className="definition-studio-editor">
          {selected ? (
            <>
              <div className="definition-studio-grid">
                <label>
                  <span>
                    ID
                  </span>

                  <input
                    value={
                      selected.id
                    }
                    onChange={(event) =>
                      patchSelected({
                        id:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    NAME
                  </span>

                  <input
                    value={
                      selected.name
                    }
                    onChange={(event) =>
                      patchSelected({
                        name:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    CATEGORY
                  </span>

                  <input
                    value={
                      selected.category
                    }
                    onChange={(event) =>
                      patchSelected({
                        category:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    TYPE
                  </span>

                  <select
                    value={
                      selected.type
                    }
                    onChange={(event) =>
                      patchSelected({
                        type:
                          event.target.value as CalibrationItemType,
                      })
                    }
                  >
                    <option value="table-3d">
                      3D TABLE
                    </option>
                    <option value="table-2d">
                      2D TABLE
                    </option>
                    <option value="curve-1d">
                      1D CURVE
                    </option>
                    <option value="scalar">
                      SCALAR
                    </option>
                    <option value="constant">
                      CONSTANT
                    </option>
                    <option value="limit">
                      LIMIT
                    </option>
                    <option value="boolean">
                      BOOLEAN
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    ADDRESS
                  </span>

                  <input
                    value={
                      selected.binary?.address ??
                      selected.address
                    }
                    onChange={(event) => {
                      patchSelected({
                        address:
                          event.target.value,
                      });

                      patchBinary({
                        address:
                          event.target.value,
                      });
                    }}
                  />
                </label>

                <label>
                  <span>
                    DATA TYPE
                  </span>

                  <select
                    value={
                      selected.binary?.dataType ??
                      selected.dataType
                    }
                    onChange={(event) => {
                      patchSelected({
                        dataType:
                          event.target.value,
                      });

                      patchBinary({
                        dataType:
                          event.target.value,
                      });
                    }}
                  >
                    <option value="uint8">
                      uint8
                    </option>
                    <option value="int8">
                      int8
                    </option>
                    <option value="uint16">
                      uint16
                    </option>
                    <option value="int16">
                      int16
                    </option>
                    <option value="uint32">
                      uint32
                    </option>
                    <option value="int32">
                      int32
                    </option>
                    <option value="float32">
                      float32
                    </option>
                    <option value="boolean">
                      boolean
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    ENDIANNESS
                  </span>

                  <select
                    value={
                      selected.binary?.endian ??
                      "little"
                    }
                    onChange={(event) =>
                      patchBinary({
                        endian:
                          event.target.value as
                            "little" |
                            "big",
                      })
                    }
                  >
                    <option value="little">
                      LITTLE ENDIAN
                    </option>
                    <option value="big">
                      BIG ENDIAN
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    UNIT
                  </span>

                  <input
                    value={
                      selected.unit
                    }
                    onChange={(event) =>
                      patchSelected({
                        unit:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    SCALE MULTIPLIER
                  </span>

                  <input
                    type="number"
                    step="0.0001"
                    value={
                      selected.binary?.scale.multiplier ??
                      1
                    }
                    onChange={(event) =>
                      patchBinary({
                        scale: {
                          multiplier:
                            Number(
                              event.target.value,
                            ),
                          offset:
                            selected.binary?.scale.offset ??
                            0,
                        },
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    SCALE OFFSET
                  </span>

                  <input
                    type="number"
                    step="0.0001"
                    value={
                      selected.binary?.scale.offset ??
                      0
                    }
                    onChange={(event) =>
                      patchBinary({
                        scale: {
                          multiplier:
                            selected.binary?.scale.multiplier ??
                            1,
                          offset:
                            Number(
                              event.target.value,
                            ),
                        },
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    ROWS
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={
                      selected.binary?.rows ??
                      selected.map?.values.length ??
                      1
                    }
                    onChange={(event) =>
                      patchBinary({
                        rows:
                          Number(
                            event.target.value,
                          ),
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    COLUMNS
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={
                      selected.binary?.columns ??
                      selected.map?.values[0]?.length ??
                      1
                    }
                    onChange={(event) =>
                      patchBinary({
                        columns:
                          Number(
                            event.target.value,
                          ),
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    X AXIS ADDRESS
                  </span>

                  <input
                    value={
                      selected.binary?.xAxisAddress ??
                      ""
                    }
                    onChange={(event) =>
                      patchBinary({
                        xAxisAddress:
                          event.target.value ||
                          null,
                      })
                    }
                  />
                </label>

                <label>
                  <span>
                    Y AXIS ADDRESS
                  </span>

                  <input
                    value={
                      selected.binary?.yAxisAddress ??
                      ""
                    }
                    onChange={(event) =>
                      patchBinary({
                        yAxisAddress:
                          event.target.value ||
                          null,
                      })
                    }
                  />
                </label>
              </div>

              <label className="definition-studio-description">
                <span>
                  DESCRIPTION
                </span>

                <textarea
                  value={
                    selected.description
                  }
                  onChange={(event) =>
                    patchSelected({
                      description:
                        event.target.value,
                    })
                  }
                />
              </label>
            </>
          ) : (
            <div className="definition-studio-empty">
              Select a calibration item.
            </div>
          )}
        </div>
      </div>

      <div className="definition-studio-validation">
        {issues.length ===
        0 ? (
          <div className="ok">
            <CheckCircle2
              size={13}
            />
            Definition validation passed.
          </div>
        ) : (
          issues.map(
            (issue) => (
              <div
                key={
                  issue.id
                }
                className={
                  issue.severity
                }
              >
                <AlertTriangle
                  size={12}
                />

                {issue.message}
              </div>
            ),
          )
        )}
      </div>
    </section>
  );
}
