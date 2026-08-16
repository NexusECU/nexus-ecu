import {
  Calculator,
  Gauge,
  Grid3X3,
  RotateCcw,
} from "lucide-react";

import {
  useState,
} from "react";

import "./advanced-calibration-tools.css";

type Props = {
  selectionCount:
    number;

  minimum:
    number;

  maximum:
    number;

  average:
    number;

  undoDepth:
    number;

  redoDepth:
    number;

  onSetExact: (
    value: number,
  ) => void;

  onClamp: (
    minimum: number,
    maximum: number,
  ) => void;

  onRound: (
    decimals: number,
  ) => void;

  onInterpolateRows:
    () => void;

  onInterpolateColumns:
    () => void;

  onRestoreBaseline:
    () => void;
};

export function AdvancedCalibrationTools({
  selectionCount,
  minimum,
  maximum,
  average,
  undoDepth,
  redoDepth,
  onSetExact,
  onClamp,
  onRound,
  onInterpolateRows,
  onInterpolateColumns,
  onRestoreBaseline,
}: Props) {
  const [
    exactValue,
    setExactValue,
  ] = useState(
    average.toString(),
  );

  const [
    clampMinimum,
    setClampMinimum,
  ] = useState(
    minimum.toString(),
  );

  const [
    clampMaximum,
    setClampMaximum,
  ] = useState(
    maximum.toString(),
  );

  const [
    decimals,
    setDecimals,
  ] = useState(
    2,
  );

  return (
    <div className="advanced-calibration-tools">
      <div className="advanced-calibration-title">
        <Gauge
          size={13}
        />

        <strong>
          ADVANCED CALIBRATION TOOLS · V6.3
        </strong>

        <span>
          {selectionCount}
          {" "}
          CELL
          {selectionCount === 1
            ? ""
            : "S"}
          {" · "}
          UNDO {undoDepth}
          {" · "}
          REDO {redoDepth}
        </span>
      </div>

      <div className="advanced-calibration-row">
        <div className="advanced-calibration-group">
          <span className="advanced-label">
            SET EXACT
          </span>

          <input
            type="number"
            value={
              exactValue
            }
            onChange={(event) =>
              setExactValue(
                event.target.value,
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              onSetExact(
                Number(
                  exactValue,
                ),
              )
            }
          >
            APPLY
          </button>
        </div>

        <div className="advanced-calibration-group">
          <span className="advanced-label">
            CLAMP
          </span>

          <input
            type="number"
            value={
              clampMinimum
            }
            onChange={(event) =>
              setClampMinimum(
                event.target.value,
              )
            }
          />

          <span>
            TO
          </span>

          <input
            type="number"
            value={
              clampMaximum
            }
            onChange={(event) =>
              setClampMaximum(
                event.target.value,
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              onClamp(
                Number(
                  clampMinimum,
                ),
                Number(
                  clampMaximum,
                ),
              )
            }
          >
            CLAMP
          </button>
        </div>

        <div className="advanced-calibration-group">
          <Calculator
            size={12}
          />

          <span className="advanced-label">
            ROUND
          </span>

          <input
            className="small"
            type="number"
            min="0"
            max="6"
            value={
              decimals
            }
            onChange={(event) =>
              setDecimals(
                Number(
                  event.target.value,
                ),
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              onRound(
                decimals,
              )
            }
          >
            DECIMALS
          </button>
        </div>
      </div>

      <div className="advanced-calibration-row secondary">
        <div className="advanced-calibration-group">
          <Grid3X3
            size={12}
          />

          <button
            type="button"
            onClick={
              onInterpolateRows
            }
          >
            INTERPOLATE EACH ROW
          </button>

          <button
            type="button"
            onClick={
              onInterpolateColumns
            }
          >
            INTERPOLATE EACH COLUMN
          </button>
        </div>

        <div className="advanced-calibration-spacer" />

        <div className="advanced-calibration-stats">
          MIN
          {" "}
          <strong>
            {minimum.toFixed(
              3,
            )}
          </strong>

          {" · MAX "}
          <strong>
            {maximum.toFixed(
              3,
            )}
          </strong>

          {" · AVG "}
          <strong>
            {average.toFixed(
              3,
            )}
          </strong>
        </div>

        <button
          type="button"
          className="restore"
          onClick={
            onRestoreBaseline
          }
        >
          <RotateCcw
            size={12}
          />

          RESTORE ORIGINAL TABLE
        </button>
      </div>

      <div className="advanced-shortcuts">
        <strong>
          SHORTCUTS
        </strong>
        Ctrl+A Select All · Ctrl+C Copy · Ctrl+V Paste ·
        Ctrl+Z Undo · Ctrl+Y Redo · Shift+Arrows Extend ·
        +/- Adjust · PgUp/PgDn % · * / Multiply/Divide ·
        I Interpolate · S Smooth · F Fill · Delete Reset
      </div>
    </div>
  );
}
