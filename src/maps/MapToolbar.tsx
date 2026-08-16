import {
  Clipboard,
  Copy,
  Minus,
  Percent,
  Plus,
  Redo2,
  RotateCcw,
  Undo2,
  Waves,
} from "lucide-react";

type MapToolbarProps = {
  canUndo: boolean;

  canRedo: boolean;

  compare: boolean;

  viewMode:
    | "table"
    | "surface";

  onUndo: () => void;

  onRedo: () => void;

  onCopy: () => void;

  onPaste: () => void;

  onAdd: (
    amount: number,
  ) => void;

  onPercent: (
    percent: number,
  ) => void;

  onSmooth: () => void;

  onInterpolate: () => void;

  onResetSelection:
    () => void;

  onToggleCompare:
    () => void;

  onViewMode: (
    mode:
      | "table"
      | "surface",
  ) => void;
};

export function MapToolbar({
  canUndo,
  canRedo,
  compare,
  viewMode,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onAdd,
  onPercent,
  onSmooth,
  onInterpolate,
  onResetSelection,
  onToggleCompare,
  onViewMode,
}: MapToolbarProps) {
  return (
    <div className="tune-toolbar">
      <div className="tune-toolbar-group">
        <button
          type="button"
          title="Undo"
          disabled={
            !canUndo
          }
          onClick={
            onUndo
          }
        >
          <Undo2
            size={15}
          />
        </button>

        <button
          type="button"
          title="Redo"
          disabled={
            !canRedo
          }
          onClick={
            onRedo
          }
        >
          <Redo2
            size={15}
          />
        </button>
      </div>

      <div className="tune-toolbar-group">
        <button
          type="button"
          title="Copy selection"
          onClick={
            onCopy
          }
        >
          <Copy
            size={15}
          />

          COPY
        </button>

        <button
          type="button"
          title="Paste selection"
          onClick={
            onPaste
          }
        >
          <Clipboard
            size={15}
          />

          PASTE
        </button>
      </div>

      <div className="tune-toolbar-group">
        <button
          type="button"
          onClick={() =>
            onAdd(
              -1,
            )
          }
        >
          <Minus
            size={14}
          />

          1
        </button>

        <button
          type="button"
          onClick={() =>
            onAdd(
              1,
            )
          }
        >
          <Plus
            size={14}
          />

          1
        </button>

        <button
          type="button"
          onClick={() =>
            onPercent(
              -5,
            )
          }
        >
          <Percent
            size={14}
          />

          -5
        </button>

        <button
          type="button"
          onClick={() =>
            onPercent(
              5,
            )
          }
        >
          <Percent
            size={14}
          />

          +5
        </button>
      </div>

      <div className="tune-toolbar-group">
        <button
          type="button"
          onClick={
            onSmooth
          }
        >
          <Waves
            size={14}
          />

          SMOOTH
        </button>

        <button
          type="button"
          onClick={
            onInterpolate
          }
        >
          INTERPOLATE
        </button>

        <button
          type="button"
          onClick={
            onResetSelection
          }
        >
          <RotateCcw
            size={14}
          />

          RESET
        </button>
      </div>

      <div className="tune-toolbar-spacer" />

      <div className="tune-toolbar-group">
        <button
          type="button"
          className={
            compare
              ? "active"
              : ""
          }
          onClick={
            onToggleCompare
          }
        >
          COMPARE
        </button>

        <button
          type="button"
          className={
            viewMode ===
            "table"
              ? "active"
              : ""
          }
          onClick={() =>
            onViewMode(
              "table",
            )
          }
        >
          TABLE
        </button>

        <button
          type="button"
          className={
            viewMode ===
            "surface"
              ? "active"
              : ""
          }
          onClick={() =>
            onViewMode(
              "surface",
            )
          }
        >
          SURFACE
        </button>
      </div>
    </div>
  );
}
