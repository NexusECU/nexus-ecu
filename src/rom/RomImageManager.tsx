import {
  Binary,
  FileDown,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import {
  bindDefinitionsToRom,
  buildRomImageInfo,
  patchRomScalar,
} from "./romService";

import type {
  RomImageInfo,
  RomScalarBinding,
} from "./romTypes";

import "./rom-image-manager.css";

type Props = {
  definitions:
    CalibrationDefinition[];

  onBindingsChange?: (
    bindings:
      RomScalarBinding[],
  ) => void;

  onImageChange?: (
    image:
      RomImageInfo | null,
  ) => void;

  onOriginalImageChange?: (
    image:
      RomImageInfo | null,
  ) => void;

  exportAllowed?: boolean;
};

export function RomImageManager({
  definitions,
  onBindingsChange,
  onImageChange,
  onOriginalImageChange,
  exportAllowed = true,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    image,
    setImage,
  ] = useState<
    RomImageInfo | null
  >(
    null,
  );

  const [
    bindings,
    setBindings,
  ] = useState<
    RomScalarBinding[]
  >([]);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(
    null,
  );

  const loadRom =
    async (
      file: File,
    ) => {
      try {
        setError(
          null,
        );

        const nextImage =
          await buildRomImageInfo(
            file,
          );

        const nextBindings =
          bindDefinitionsToRom(
            nextImage,
            definitions,
          );

        setImage(
          nextImage,
        );

        onImageChange?.(
          nextImage,
        );

        onOriginalImageChange?.(
          {
            ...nextImage,
            bytes:
              new Uint8Array(
                nextImage.bytes,
              ),
          },
        );

        setBindings(
          nextBindings,
        );

        onBindingsChange?.(
          nextBindings,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      }
    };

  const exportRom =
    () => {
      if (!image) {
        return;
      }

      const blob =
        new Blob(
          [
            new Uint8Array(
              image.bytes,
            ),
          ],
          {
            type:
              "application/octet-stream",
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
        image.fileName.replace(
          /(\.[^.]+)?$/,
          "-modified$1",
        );

      anchor.click();

      URL.revokeObjectURL(
        url,
      );
    };

  const updateBinding =
    (
      binding:
        RomScalarBinding,
      value:
        number | boolean,
    ) => {
      if (
        !image ||
        !binding.valid
      ) {
        return;
      }

      try {
        const bytes =
          patchRomScalar(
            image,
            binding,
            value,
          );

        const nextImage = {
          ...image,
          bytes,
        };

        const nextBindings =
          bindings.map(
            (item) =>
              item.definitionId ===
                binding.definitionId
                ? {
                    ...item,
                    currentValue:
                      value,
                  }
                : item,
          );

        setImage(
          nextImage,
        );

        onImageChange?.(
          nextImage,
        );

        setBindings(
          nextBindings,
        );

        onBindingsChange?.(
          nextBindings,
        );
      } catch (
        caught
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : String(
                caught,
              ),
        );
      }
    };

  return (
    <section className="rom-image-manager">
      <input
        ref={inputRef}
        type="file"
        accept=".bin,.rom,.hex,.img"
        hidden
        onChange={(event) => {
          const file =
            event.target.files?.[0];

          if (file) {
            void loadRom(
              file,
            );
          }

          event.currentTarget.value =
            "";
        }}
      />

      <div className="rom-image-header">
        <div>
          <Binary
            size={15}
          />

          <div>
            <span className="eyebrow">
              ROM IMAGE / BINARY
            </span>

            <h3>
              ROM Image Manager
            </h3>
          </div>
        </div>

        <div className="rom-image-safe">
          <ShieldCheck
            size={13}
          />

          OFFLINE FILE EDITING ONLY
        </div>
      </div>

      <div className="rom-image-controls">
        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
        >
          <FolderOpen
            size={13}
          />

          OPEN ROM IMAGE
        </button>

        <button
          type="button"
          disabled={
            !image ||
            !exportAllowed
          }
          onClick={
            exportRom
          }
        >
          <FileDown
            size={13}
          />

          EXPORT MODIFIED COPY
        </button>
      </div>

      {image ? (
        <>
          <div className="rom-image-meta">
            <div>
              <span>
                FILE
              </span>

              <strong>
                {image.fileName}
              </strong>
            </div>

            <div>
              <span>
                SIZE
              </span>

              <strong>
                {image.sizeBytes.toLocaleString()}
                {""}
                bytes
              </strong>
            </div>

            <div>
              <span>
                SHA-256
              </span>

              <strong>
                {image.sha256}
              </strong>
            </div>

            <div>
              <span>
                BINDINGS
              </span>

              <strong>
                {bindings.filter(
                  (item) =>
                    item.valid,
                ).length}
                {" / "}
                {bindings.length}
              </strong>
            </div>
          </div>

          <div className="rom-binding-table-shell">
            <table className="rom-binding-table">
              <thead>
                <tr>
                  <th>
                    DEFINITION
                  </th>
                  <th>
                    ADDRESS
                  </th>
                  <th>
                    TYPE
                  </th>
                  <th>
                    ORIGINAL
                  </th>
                  <th>
                    CURRENT
                  </th>
                  <th>
                    STATUS
                  </th>
                </tr>
              </thead>

              <tbody>
                {bindings.map(
                  (binding) => {
                    const definition =
                      definitions.find(
                        (item) =>
                          item.id ===
                          binding.definitionId,
                      );

                    return (
                      <tr
                        key={
                          binding.definitionId
                        }
                      >
                        <td>
                          {definition?.name ??
                            binding.definitionId}
                        </td>

                        <td>
                          0x
                          {binding.address
                            .toString(
                              16,
                            )
                            .toUpperCase()
                            .padStart(
                              6,
                              "0",
                            )}
                        </td>

                        <td>
                          {binding.dataType}
                        </td>

                        <td>
                          {String(
                            binding.originalValue ??
                              "—",
                          )}
                        </td>

                        <td>
                          {typeof binding.currentValue ===
                          "boolean" ? (
                            <input
                              type="checkbox"
                              checked={
                                binding.currentValue
                              }
                              disabled={
                                !binding.valid
                              }
                              onChange={(event) =>
                                updateBinding(
                                  binding,
                                  event.target.checked,
                                )
                              }
                            />
                          ) : (
                            <input
                              type="number"
                              value={
                                typeof binding.currentValue ===
                                  "number"
                                  ? binding.currentValue
                                  : 0
                              }
                              disabled={
                                !binding.valid
                              }
                              onChange={(event) =>
                                updateBinding(
                                  binding,
                                  Number(
                                    event.target.value,
                                  ),
                                )
                              }
                            />
                          )}
                        </td>

                        <td
                          className={
                            binding.valid
                              ? "ok"
                              : "error"
                          }
                        >
                          {binding.valid
                            ? "BOUND"
                            : binding.error}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rom-image-empty">
          Open a ROM image to inspect file metadata and
          bind scalar/limit/switch definition addresses to
          offline binary values.
        </div>
      )}

      {error && (
        <div className="rom-image-error">
          {error}
        </div>
      )}
    </section>
  );
}
