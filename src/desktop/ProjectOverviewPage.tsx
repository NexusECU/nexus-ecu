import {
  Archive,
  Car,
  FileClock,
  FilePlus2,
  FolderOpen,
  History,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import "./project-overview-page.css";

type Props = {
  projectName: string;
  projectSaved: boolean;
  vin: string;
  make: string;
  model: string;
  year: string;
  engine: string;
  ecu: string;
  transmission: string;
  fuel: string;
  romLoaded: boolean;
  revisionCount: number;
  editCount: number;
  hasProject: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
};

export function ProjectOverviewPage({
  projectName,
  projectSaved,
  vin,
  make,
  model,
  year,
  engine,
  ecu,
  transmission,
  fuel,
  romLoaded,
  revisionCount,
  editCount,
  hasProject,
  onNew,
  onOpen,
  onSave,
}: Props) {
  return (
    <div className="project-overview-page">
      <section className="project-overview-hero">
        <div className="project-overview-title">
          <div className="project-overview-icon">
            <Car size={22} />
          </div>

          <div>
            <span className="eyebrow">VEHICLE PROJECT</span>
            <h1>{hasProject ? projectName : "No Project Open"}</h1>
            <p>
              {hasProject
                ? "Vehicle identity, calibration context, revisions and project storage in one workspace."
                : "Create a new vehicle project or open an existing project to begin."}
            </p>
          </div>
        </div>

        <div className="project-overview-actions">
          <button type="button" className="primary" onClick={onNew}>
            <FilePlus2 size={14} />
            NEW PROJECT
          </button>

          <button type="button" onClick={onOpen}>
            <FolderOpen size={14} />
            OPEN
          </button>

          <button type="button" disabled={!hasProject} onClick={onSave}>
            <Save size={14} />
            SAVE
          </button>
        </div>
      </section>

      <section className="project-overview-status">
        <StatusCard
          label="PROJECT"
          value={hasProject ? (projectSaved ? "SAVED" : "UNSAVED") : "NONE"}
          good={hasProject && projectSaved}
        />
        <StatusCard
          label="VEHICLE"
          value={[year, make, model].filter(Boolean).join(" ") || "UNKNOWN"}
          good={Boolean(make || model)}
        />
        <StatusCard label="ECU" value={ecu || "UNKNOWN"} good={Boolean(ecu)} />
        <StatusCard label="ROM" value={romLoaded ? "LOADED" : "NONE"} good={romLoaded} />
      </section>

      {!hasProject ? (
        <section className="project-empty-state">
          <FilePlus2 size={28} />
          <h2>Start with a vehicle project</h2>
          <p>
            Projects keep vehicle details, ECU context, calibration revisions,
            logs and backups together.
          </p>
          <div>
            <button type="button" className="primary" onClick={onNew}>
              CREATE PROJECT
            </button>
            <button type="button" onClick={onOpen}>
              OPEN EXISTING
            </button>
          </div>
        </section>
      ) : (
        <div className="project-overview-grid">
          <section className="project-overview-card">
            <div className="project-card-heading">
              <Car size={16} />
              <div>
                <span className="eyebrow">VEHICLE</span>
                <h2>Vehicle Identity</h2>
              </div>
            </div>

            <div className="project-info-grid">
              <InfoRow label="VIN" value={vin || "Unknown"} />
              <InfoRow label="Make" value={make || "Unknown"} />
              <InfoRow label="Model" value={model || "Unknown"} />
              <InfoRow label="Year" value={year || "Unknown"} />
              <InfoRow label="Engine" value={engine || "Unknown"} />
              <InfoRow label="Fuel" value={fuel || "Unknown"} />
            </div>
          </section>

          <section className="project-overview-card">
            <div className="project-card-heading">
              <Wrench size={16} />
              <div>
                <span className="eyebrow">ECU / CALIBRATION</span>
                <h2>Calibration Context</h2>
              </div>
            </div>

            <div className="project-info-grid">
              <InfoRow label="ECU" value={ecu || "Unknown"} />
              <InfoRow label="Transmission" value={transmission || "Unknown"} />
              <InfoRow label="ROM" value={romLoaded ? "Loaded" : "Not loaded"} />
              <InfoRow label="Project State" value={projectSaved ? "Saved" : "Unsaved changes"} />
            </div>

            <div className="project-context-note">
              <ShieldCheck size={13} />
              Project metadata never overrides ECU compatibility or safety gates.
            </div>
          </section>

          <section className="project-overview-card">
            <div className="project-card-heading">
              <History size={16} />
              <div>
                <span className="eyebrow">HISTORY</span>
                <h2>Revisions & Edits</h2>
              </div>
            </div>

            <div className="project-large-stats">
              <div>
                <strong>{revisionCount}</strong>
                <span>REVISIONS</span>
              </div>
              <div>
                <strong>{editCount}</strong>
                <span>MAP EDITS</span>
              </div>
            </div>
          </section>

          <section className="project-overview-card">
            <div className="project-card-heading">
              <Archive size={16} />
              <div>
                <span className="eyebrow">STORAGE</span>
                <h2>Backups & Files</h2>
              </div>
            </div>

            <div className="project-storage-summary">
              <FileClock size={24} />
              <div>
                <strong>Project files stay together</strong>
                <span>
                  Restore points, ROM backups and project metadata remain attached
                  to the active vehicle project.
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className={`project-status-card ${good ? "good" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="project-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
