import {
  FileJson,
  FolderOpen,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import type {
  NexusDefinitionFile,
} from "./definitionFileTypes";

import {
  parseDefinitionFile,
  serialiseDefinitionFile,
} from "./definitionFileService";

import "./definition-file-manager.css";

type Props = {
  activeFile:
    NexusDefinitionFile | null;

  onLoad: (
    file:
      NexusDefinitionFile,
  ) => void;
};

export function DefinitionFileManager({
  activeFile,
  onLoad,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(
    null,
  );

  const openPicker =
    () => {
      inputRef.current?.click();
    };

  const loadFile =
    async (
      file: File,
    ) => {
      try {
        setError(
          null,
        );

        const text =
          await file.text();

        onLoad(
          parseDefinitionFile(
            text,
          ),
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

  const exportActive =
    () => {
      if (!activeFile) {
        return;
      }

      const blob =
        new Blob(
          [
            serialiseDefinitionFile(
              activeFile,
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
        `${activeFile.id}.nexusdef.json`;

      anchor.click();

      URL.revokeObjectURL(
        url,
      );
    };

  return (
    <section className="definition-file-manager">
      <input
        ref={inputRef}
        type="file"
        accept=".json,.nexusdef,.nexusdef.json"
        hidden
        onChange={(event) => {
          const file =
            event.target.files?.[0];

          if (file) {
            void loadFile(
              file,
            );
          }

          event.currentTarget.value =
            "";
        }}
      />

      <div className="definition-file-manager-title">
        <div>
          <FileJson
            size={15}
          />

          <div>
            <span className="eyebrow">
              EXTERNAL ROM DEFINITIONS
            </span>

            <h3>
              Definition File Manager
            </h3>
          </div>
        </div>

        <div className="definition-file-manager-safe">
          <ShieldCheck
            size={13}
          />

          METADATA / CALIBRATION STRUCTURE ONLY
        </div>
      </div>

      <div className="definition-file-manager-controls">
        <button
          type="button"
          onClick={
            openPicker
          }
        >
          <FolderOpen
            size={13}
          />

          OPEN DEFINITION
        </button>

        <button
          type="button"
          disabled={
            !activeFile
          }
          onClick={
            exportActive
          }
        >
          <Save
            size={13}
          />

          EXPORT DEFINITION
        </button>
      </div>

      {activeFile ? (
        <div className="definition-file-meta">
          <div>
            <span>
              DEFINITION
            </span>

            <strong>
              {activeFile.name}
            </strong>
          </div>

          <div>
            <span>
              VENDOR
            </span>

            <strong>
              {activeFile.vendor}
            </strong>
          </div>

          <div>
            <span>
              ECU FAMILY
            </span>

            <strong>
              {activeFile.ecuFamily}
            </strong>
          </div>

          <div>
            <span>
              ROM ID
            </span>

            <strong>
              {activeFile.romId}
            </strong>
          </div>

          <div>
            <span>
              ITEMS
            </span>

            <strong>
              {activeFile.definitions.length}
            </strong>
          </div>
        </div>
      ) : (
        <div className="definition-file-empty">
          No external definition loaded. NEXUS is using its
          built-in development definition.
        </div>
      )}

      {error && (
        <div className="definition-file-error">
          {error}
        </div>
      )}
    </section>
  );
}
