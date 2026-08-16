import {
  Bookmark,
  CheckCircle2,
  GitCompareArrows,
  History,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type {
  CalibrationSet,
} from "../calibration/calibrationManager";

import type {
  NexusProject,
  ProjectVehicleDetails,
} from "./projectTypes";

import {
  RevisionComparePanel,
  type RevisionCompareCell,
} from "./RevisionComparePanel";

import type {
  MapKind,
} from "../maps/mapTypes";

import "./project-manager.css";

type ValidationIssue = {
  severity: "warning" | "error";
  message: string;
};

type ProjectManagerProps = {
  project: NexusProject;
  maps: CalibrationSet["maps"];
  dirty: boolean;
  onProjectChange: (project: NexusProject) => void;
  onCreateRevision: (name: string) => void;
  onRestoreRevision: (revisionId: string) => void;

  onApplyRevisionCells: (
    mapKind: MapKind,
    sourceRevisionId: string,
    cells: RevisionCompareCell[],
  ) => void;
};

function validateMaps(
  maps: CalibrationSet["maps"],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const inspect = (
    label: string,
    values: number[][],
    min: number,
    max: number,
  ) => {
    let invalid = 0;
    let outOfRange = 0;

    values.flat().forEach((value) => {
      if (!Number.isFinite(value)) {
        invalid++;
      } else if (value < min || value > max) {
        outOfRange++;
      }
    });

    if (invalid > 0) {
      issues.push({
        severity: "error",
        message: `${label}: ${invalid} non-finite cell value(s).`,
      });
    }

    if (outOfRange > 0) {
      issues.push({
        severity: "warning",
        message: `${label}: ${outOfRange} cell(s) outside the broad validation envelope.`,
      });
    }
  };

  inspect("Fuel", maps.fuel.values, 5, 25);
  inspect("Ignition", maps.ignition.values, -30, 70);
  inspect("Boost", maps.boost.values, 0, 400);

  return issues;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="project-manager-field">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function ProjectManager({
  project,
  maps,
  dirty,
  onProjectChange,
  onCreateRevision,
  onRestoreRevision,
  onApplyRevisionCells,
}: ProjectManagerProps) {
  const issues = validateMaps(maps);

  const updateVehicle = (
    key: keyof ProjectVehicleDetails,
    value: string,
  ) => {
    onProjectChange({
      ...project,
      vehicle: {
        ...project.vehicle,
        [key]: value,
      },
    });
  };

  return (
    <section className="project-manager panel">
      <div className="project-manager-header">
        <div>
          <span className="eyebrow">NEXUS PROJECT CONTROL</span>
          <h2>Tune Project & Calibration Management</h2>
          <p>
            Vehicle identity, tuner notes, validation, revisions and calibration
            history are stored with the .nexus project.
          </p>
        </div>

        <div className={`project-manager-dirty ${dirty ? "active" : ""}`}>
          <Save size={14} />
          {dirty ? "UNSAVED CHANGES" : "PROJECT SAVED"}
        </div>
      </div>

      <div className="project-manager-grid">
        <div className="project-manager-card">
          <div className="project-manager-title">
            <Bookmark size={15} />
            <strong>PROJECT DETAILS</strong>
          </div>

          <div className="project-manager-fields two">
            <Field
              label="PROJECT NAME"
              value={project.name}
              onChange={(name) => onProjectChange({...project, name})}
            />
            <Field
              label="TUNER / OPERATOR"
              value={project.tunerName}
              onChange={(tunerName) => onProjectChange({...project, tunerName})}
              placeholder="Optional"
            />
          </div>

          <label className="project-manager-field">
            <span>PROJECT NOTES</span>
            <textarea
              value={project.notes}
              placeholder="Tune goals, dyno notes, customer requests…"
              onChange={(event) =>
                onProjectChange({...project, notes: event.target.value})
              }
            />
          </label>
        </div>

        <div className="project-manager-card">
          <div className="project-manager-title">
            <ShieldCheck size={15} />
            <strong>VEHICLE / ECU PROFILE</strong>
          </div>

          <div className="project-manager-fields three">
            <Field label="VIN" value={project.vehicle.vin} onChange={(v) => updateVehicle("vin", v)} />
            <Field label="MAKE" value={project.vehicle.make} onChange={(v) => updateVehicle("make", v)} />
            <Field label="MODEL" value={project.vehicle.model} onChange={(v) => updateVehicle("model", v)} />
            <Field label="YEAR" value={project.vehicle.year} onChange={(v) => updateVehicle("year", v)} />
            <Field label="ENGINE" value={project.vehicle.engine} onChange={(v) => updateVehicle("engine", v)} />
            <Field label="ECU" value={project.vehicle.ecu} onChange={(v) => updateVehicle("ecu", v)} />
            <Field label="TRANSMISSION" value={project.vehicle.transmission} onChange={(v) => updateVehicle("transmission", v)} />
            <Field label="FUEL" value={project.vehicle.fuel} onChange={(v) => updateVehicle("fuel", v)} />
          </div>

          <label className="project-manager-field">
            <span>MODIFICATIONS</span>
            <textarea
              value={project.vehicle.modifications}
              placeholder="Turbo, injectors, exhaust, cams, fuel system…"
              onChange={(event) => updateVehicle("modifications", event.target.value)}
            />
          </label>
        </div>

        <div className="project-manager-card">
          <div className="project-manager-title">
            <GitCompareArrows size={15} />
            <strong>CALIBRATION VALIDATION</strong>
          </div>

          {issues.length === 0 ? (
            <div className="project-validation-ok">
              <CheckCircle2 size={18} />
              <div>
                <strong>VALIDATION PASSED</strong>
                <span>No invalid or broadly out-of-envelope map values detected.</span>
              </div>
            </div>
          ) : (
            <div className="project-validation-list">
              {issues.map((issue, index) => (
                <div key={`${issue.message}-${index}`} className={issue.severity}>
                  <TriangleAlert size={14} />
                  {issue.message}
                </div>
              ))}
            </div>
          )}

          <p className="project-validation-note">
            Validation is a project sanity check, not a guarantee that a
            calibration is safe for a particular engine or vehicle.
          </p>
        </div>

        <div className="project-manager-card">
          <div className="project-manager-title">
            <History size={15} />
            <strong>CALIBRATION REVISIONS</strong>
          </div>

          <div className="project-revision-create">
            <input
              id="nexus-revision-name"
              placeholder={`Revision ${project.revisions.length + 1}`}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById(
                  "nexus-revision-name",
                ) as HTMLInputElement | null;
                onCreateRevision(input?.value ?? "");
                if (input) input.value = "";
              }}
            >
              CREATE SNAPSHOT
            </button>
          </div>

          <div className="project-revision-list">
            {project.revisions.length === 0 ? (
              <div className="project-manager-empty">
                No revisions yet. Create a snapshot before major tune changes.
              </div>
            ) : (
              [...project.revisions].reverse().map((revision) => (
                <div className="project-revision-row" key={revision.id}>
                  <div>
                    <strong>{revision.name}</strong>
                    <span>{new Date(revision.createdAt).toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestoreRevision(revision.id)}
                  >
                    RESTORE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="project-manager-card wide">
          <RevisionComparePanel
            project={
              project
            }
            currentMaps={
              maps
            }
            onApplyCells={
              onApplyRevisionCells
            }
          />
        </div>

        <div className="project-manager-card wide">
          <div className="project-manager-title">
            <History size={15} />
            <strong>EDIT HISTORY</strong>
          </div>

          <div className="project-edit-history">
            {project.editHistory.length === 0 ? (
              <div className="project-manager-empty">No map edits recorded yet.</div>
            ) : (
              [...project.editHistory].reverse().slice(0, 30).map((entry) => (
                <div key={entry.id}>
                  <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                  <strong>{entry.mapName}</strong>
                  <small>{entry.changedCells} changed cell(s)</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
