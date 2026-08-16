import type {
  CalibrationDefinition,
} from "./calibrationDefinitionTypes";

import "./definition-editor.css";

type Props = {
  definition: CalibrationDefinition;

  onValueChange: (
    id: string,
    value:
      number |
      boolean |
      string,
  ) => void;
};

export function DefinitionEditor({
  definition,
  onValueChange,
}: Props) {
  const isBoolean =
    definition.type === "boolean";

  const booleanValue =
    typeof definition.value ===
      "boolean"
      ? definition.value
      : false;

  return (
    <section className="definition-editor">
      <div className="definition-editor-titlebar">
        <strong>{definition.name}</strong>
        <span>{definition.address}</span>
      </div>

      <div className="definition-editor-menu">
        <button type="button">Edit</button>
        <button type="button">View</button>
        <button type="button">Help</button>
      </div>

      <div className="definition-meta-grid">
        <div>
          <span>TYPE</span>
          <strong>{definition.type}</strong>
        </div>

        <div>
          <span>DATA TYPE</span>
          <strong>{definition.dataType}</strong>
        </div>

        <div>
          <span>ADDRESS</span>
          <strong>{definition.address}</strong>
        </div>

        <div>
          <span>UNIT</span>
          <strong>{definition.unit || "—"}</strong>
        </div>
      </div>

      <div className="definition-value-panel">
        <div>
          <span className="eyebrow">
            CALIBRATION ITEM
          </span>

          <h3>{definition.name}</h3>

          <p>{definition.description}</p>
        </div>

        {isBoolean ? (
          <label className="definition-switch">
            <input
              type="checkbox"
              checked={booleanValue}
              disabled={definition.readOnly}
              onChange={(event) =>
                onValueChange(
                  definition.id,
                  event.target.checked,
                )
              }
            />

            <span>
              {booleanValue
                ? "ENABLED"
                : "DISABLED"}
            </span>
          </label>
        ) : (
          <label className="definition-number">
            <input
              type="number"
              value={
                typeof definition.value ===
                  "number"
                  ? definition.value
                  : 0
              }
              disabled={definition.readOnly}
              onChange={(event) =>
                onValueChange(
                  definition.id,
                  Number(
                    event.target.value,
                  ),
                )
              }
            />

            <span>{definition.unit}</span>
          </label>
        )}
      </div>

      <div className="definition-editor-status">
        {definition.readOnly
          ? "READ ONLY"
          : "EDITABLE"}
        {" · "}
        {definition.category}
        {" · "}
        {definition.dataType}
      </div>
    </section>
  );
}
