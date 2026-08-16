import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileWarning,
  ShieldAlert,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  NexusDefinitionFile,
} from "../maps/definitionFileTypes";

import type {
  RomImageInfo,
} from "./romTypes";

import {
  diffRomBytes,
  validateRomImage,
} from "./romValidationService";

import "./rom-validation.css";

type Props = {
  originalImage:
    RomImageInfo | null;

  currentImage:
    RomImageInfo | null;

  definitions:
    CalibrationDefinition[];

  definitionFile:
    NexusDefinitionFile | null;
};

export function RomValidationPanel({
  originalImage,
  currentImage,
  definitions,
  definitionFile,
}: Props) {
  const report =
    useMemo(
      () => {
        if (
          !originalImage ||
          !currentImage
        ) {
          return null;
        }

        return validateRomImage(
          originalImage.bytes,
          currentImage.bytes,
          definitions,
          definitionFile,
        );
      },
      [
        originalImage,
        currentImage,
        definitions,
        definitionFile,
      ],
    );

  const changes =
    useMemo(
      () => {
        if (
          !originalImage ||
          !currentImage
        ) {
          return [];
        }

        return diffRomBytes(
          originalImage.bytes,
          currentImage.bytes,
        );
      },
      [
        originalImage,
        currentImage,
      ],
    );

  if (
    !originalImage ||
    !currentImage ||
    !report
  ) {
    return (
      <section className="rom-validation-panel">
        <div className="rom-validation-empty">
          <ShieldAlert
            size={18}
          />

          Load a ROM image to run validation.
        </div>
      </section>
    );
  }

  return (
    <section className="rom-validation-panel">
      <div className="rom-validation-header">
        <div>
          <FileCheck2
            size={15}
          />

          <div>
            <span className="eyebrow">
              ROM VALIDATION & SAFETY
            </span>

            <h3>
              Pre-export Validation
            </h3>
          </div>
        </div>

        <div
          className={`rom-validation-result ${
            report.valid
              ? "ok"
              : "error"
          }`}
        >
          {report.valid ? (
            <CheckCircle2
              size={13}
            />
          ) : (
            <FileWarning
              size={13}
            />
          )}

          {report.valid
            ? "VALIDATION PASSED"
            : "VALIDATION FAILED"}
        </div>
      </div>

      <div className="rom-validation-stats">
        <div>
          <span>
            ERRORS
          </span>

          <strong>
            {report.errors}
          </strong>
        </div>

        <div>
          <span>
            WARNINGS
          </span>

          <strong>
            {report.warnings}
          </strong>
        </div>

        <div>
          <span>
            MODIFIED BYTES
          </span>

          <strong>
            {report.modifiedBytes}
          </strong>
        </div>

        <div>
          <span>
            CHANGE RANGES
          </span>

          <strong>
            {report.changedRanges}
          </strong>
        </div>

        <div>
          <span>
            CHECKSUM
          </span>

          <strong>
            {report.checksumStatus}
          </strong>
        </div>
      </div>

      <div className="rom-validation-issues">
        {report.issues.map(
          (issue) => (
            <div
              key={
                issue.id
              }
              className={
                issue.severity
              }
            >
              {issue.severity ===
              "error" ? (
                <FileWarning
                  size={12}
                />
              ) : issue.severity ===
                "warning" ? (
                <AlertTriangle
                  size={12}
                />
              ) : (
                <CheckCircle2
                  size={12}
                />
              )}

              <div>
                <strong>
                  {issue.title}
                </strong>

                <span>
                  {issue.detail}
                </span>
              </div>
            </div>
          ),
        )}
      </div>

      {changes.length >
      0 && (
        <div className="rom-byte-diff">
          <div className="rom-byte-diff-title">
            FIRST MODIFIED BYTES
          </div>

          <table>
            <thead>
              <tr>
                <th>
                  OFFSET
                </th>

                <th>
                  BEFORE
                </th>

                <th>
                  AFTER
                </th>
              </tr>
            </thead>

            <tbody>
              {changes
                .slice(
                  0,
                  64,
                )
                .map(
                  (change) => (
                    <tr
                      key={
                        change.offset
                      }
                    >
                      <td>
                        0x
                        {change.offset
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
                        {change.before
                          .toString(
                            16,
                          )
                          .toUpperCase()
                          .padStart(
                            2,
                            "0",
                          )}
                      </td>

                      <td>
                        {change.after
                          .toString(
                            16,
                          )
                          .toUpperCase()
                          .padStart(
                            2,
                            "0",
                          )}
                      </td>
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
