import {
  FilePlus2,
  FolderOpen,
  HardDrive,
  Save,
  SaveAll,
} from "lucide-react";

import type {
  RecentProject,
} from "./projectTypes";

import "./project-bar.css";

type ProjectBarProps = {
  projectName: string;

  projectPath:
    string | null;

  dirty: boolean;

  desktopMode: boolean;

  busy: boolean;

  recentProjects:
    RecentProject[];

  onNew: () => void;

  onOpen: () => void;

  onSave: () => void;

  onSaveAs: () => void;

  onOpenRecent: (
    project:
      RecentProject,
  ) => void;
};

export function ProjectBar({
  projectName,
  projectPath,
  dirty,
  desktopMode,
  busy,
  recentProjects,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onOpenRecent,
}: ProjectBarProps) {
  return (
    <div className="project-bar">
      <div className="project-identity">
        <div className="project-icon">
          <HardDrive
            size={16}
          />
        </div>

        <div>
          <span>
            PROJECT
          </span>

          <strong>
            {projectName}
            {dirty
              ? " *"
              : ""}
          </strong>

          <small>
            {projectPath ??
              "Unsaved project"}
          </small>
        </div>
      </div>

      <div className="project-actions">
        <button
          type="button"
          disabled={busy}
          onClick={onNew}
        >
          <FilePlus2
            size={14}
          />

          NEW
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onOpen}
        >
          <FolderOpen
            size={14}
          />

          OPEN
        </button>

        <button
          type="button"
          disabled={
            busy ||
            !dirty
          }
          onClick={onSave}
        >
          <Save
            size={14}
          />

          SAVE
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onSaveAs}
        >
          <SaveAll
            size={14}
          />

          SAVE AS
        </button>
      </div>

      <div className="project-recent">
        <span>
          RECENT
        </span>

        <select
          value=""
          disabled={
            busy ||
            recentProjects.length ===
              0
          }
          onChange={(event) => {
            const match =
              recentProjects.find(
                (item) =>
                  item.path ===
                  event.target.value,
              );

            if (match) {
              onOpenRecent(
                match,
              );
            }
          }}
        >
          <option value="">
            {recentProjects.length ===
            0
              ? "No recent projects"
              : "Open recent project…"}
          </option>

          {recentProjects.map(
            (item) => (
              <option
                key={
                  item.path
                }
                value={
                  item.path
                }
              >
                {item.name}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="project-platform">
        <span
          className={`status-dot ${
            desktopMode
              ? "online"
              : ""
          }`}
        />

        {desktopMode
          ? "DESKTOP"
          : "WEB PREVIEW"}
      </div>
    </div>
  );
}
