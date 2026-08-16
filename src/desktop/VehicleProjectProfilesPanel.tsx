import {
  CarFront,
  FolderOpen,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  NexusProjectSessionState,
} from "./sessionPersistenceTypes";

import {
  activateVehicleProject,
  createVehicleProject,
  deleteVehicleProject,
  listVehicleProjects,
  updateVehicleProject,
} from "./vehicleProjectService";

import type {
  VehicleProjectProfile,
} from "./vehicleProjectTypes";

import "./vehicle-project-profiles.css";

type Props = {
  currentSession:
    NexusProjectSessionState;

  onOpenProject: (
    project:
      VehicleProjectProfile,
  ) => void;

  onActiveProjectChange?: (
    project:
      VehicleProjectProfile | null,
  ) => void;
};

export function VehicleProjectProfilesPanel({
  currentSession,
  onOpenProject,
  onActiveProjectChange,
}: Props) {
  const [
    projects,
    setProjects,
  ] = useState<
    VehicleProjectProfile[]
  >(
    () =>
      listVehicleProjects(),
  );

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    string | null
  >(
    projects[0]?.id ??
    null,
  );

  const selected =
    useMemo(
      () =>
        projects.find(
          project =>
            project.id ===
            selectedId,
        ) ??
        null,
      [
        projects,
        selectedId,
      ],
    );

  const [
    newName,
    setNewName,
  ] = useState(
    "New NEXUS Project",
  );

  const [
    newVehicleLabel,
    setNewVehicleLabel,
  ] = useState(
    "Unknown Vehicle",
  );

  const [
    newNotes,
    setNewNotes,
  ] = useState("");

  const refresh =
    () =>
      setProjects(
        listVehicleProjects(),
      );

  const create =
    () => {
      const project =
        createVehicleProject(
          currentSession,
          newName,
          newVehicleLabel,
          newNotes,
        );

      refresh();

      setSelectedId(
        project.id,
      );

      onOpenProject(
        project,
      );

      onActiveProjectChange?.(
        project,
      );
    };

  const saveCurrent =
    () => {
      if (
        !selected
      ) {
        return;
      }

      const updated =
        updateVehicleProject(
          selected.id,
          currentSession,
        );

      refresh();

      if (
        updated
      ) {
        setSelectedId(
          updated.id,
        );
      }
    };

  const openSelected =
    () => {
      if (
        !selected
      ) {
        return;
      }

      const active =
        activateVehicleProject(
          selected.id,
        );

      if (
        active
      ) {
        onOpenProject(
          active,
        );

        onActiveProjectChange?.(
          active,
        );
      }
    };

  const removeSelected =
    () => {
      if (
        !selected
      ) {
        return;
      }

      deleteVehicleProject(
        selected.id,
      );

      const next =
        listVehicleProjects();

      setProjects(
        next,
      );

      setSelectedId(
        next[0]?.id ??
        null,
      );

      onActiveProjectChange?.(
        next[0] ??
        null,
      );
    };

  return (
    <section className="vehicle-project-profiles">
      <div className="vehicle-project-profiles-header">
        <div>
          <CarFront
            size={16}
          />

          <div>
            <span className="eyebrow">
              VEHICLE & ECU PROJECT PROFILES
            </span>

            <h3>
              Recent Projects
            </h3>
          </div>
        </div>

        <strong>
          {projects.length}
          {""}
          PROJECT
          {projects.length === 1
            ? ""
            : "S"}
        </strong>
      </div>

      <div className="vehicle-project-layout">
        <div className="vehicle-project-list">
          {projects.length ? (
            projects.map(
              project => (
                <button
                  type="button"
                  key={
                    project.id
                  }
                  className={
                    project.id ===
                    selectedId
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedId(
                      project.id,
                    )
                  }
                >
                  <strong>
                    {project.name}
                  </strong>

                  <span>
                    {project.vehicleLabel}
                  </span>

                  <em>
                    {project.vin ??
                      "VIN UNKNOWN"}
                    {" · "}
                    {project.calibrationId ??
                      "CAL ID UNKNOWN"}
                  </em>
                </button>
              ),
            )
          ) : (
            <div className="vehicle-project-empty">
              No vehicle projects yet.
            </div>
          )}
        </div>

        <div className="vehicle-project-detail">
          {selected ? (
            <>
              <div className="vehicle-project-detail-grid">
                <Info
                  label="PROJECT"
                  value={
                    selected.name
                  }
                />

                <Info
                  label="VEHICLE"
                  value={
                    selected.vehicleLabel
                  }
                />

                <Info
                  label="VIN"
                  value={
                    selected.vin ??
                    "UNKNOWN"
                  }
                />

                <Info
                  label="ECU"
                  value={
                    selected.ecuLabel
                  }
                />

                <Info
                  label="CALIBRATION ID"
                  value={
                    selected.calibrationId ??
                    "UNKNOWN"
                  }
                />

                <Info
                  label="UPDATED"
                  value={
                    new Date(
                      selected.updatedAt,
                    ).toLocaleString()
                  }
                />
              </div>

              <div className="vehicle-project-notes">
                <span>
                  NOTES
                </span>

                <p>
                  {selected.notes ||
                    "No notes saved for this project."}
                </p>
              </div>

              <div className="vehicle-project-actions">
                <button
                  type="button"
                  onClick={
                    openSelected
                  }
                >
                  <FolderOpen
                    size={12}
                  />

                  OPEN PROJECT
                </button>

                <button
                  type="button"
                  onClick={
                    saveCurrent
                  }
                >
                  <Save
                    size={12}
                  />

                  SAVE CURRENT SESSION TO PROJECT
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={
                    removeSelected
                  }
                >
                  <Trash2
                    size={12}
                  />

                  DELETE PROJECT
                </button>
              </div>
            </>
          ) : (
            <div className="vehicle-project-empty detail">
              Select a project or create a new one.
            </div>
          )}
        </div>
      </div>

      <div className="vehicle-project-create">
        <div className="vehicle-project-create-title">
          <Plus
            size={12}
          />

          CREATE PROJECT FROM CURRENT SESSION
        </div>

        <input
          value={
            newName
          }
          placeholder="Project name"
          onChange={
            event =>
              setNewName(
                event.target.value,
              )
          }
        />

        <input
          value={
            newVehicleLabel
          }
          placeholder="Vehicle label, e.g. 2017 Ford Mustang GT"
          onChange={
            event =>
              setNewVehicleLabel(
                event.target.value,
              )
          }
        />

        <textarea
          value={
            newNotes
          }
          placeholder="Project notes…"
          onChange={
            event =>
              setNewNotes(
                event.target.value,
              )
          }
        />

        <button
          type="button"
          onClick={
            create
          }
        >
          <Plus
            size={12}
          />

          CREATE VEHICLE PROJECT
        </button>
      </div>

      <div className="vehicle-project-footer">
        Opening a vehicle project restores saved project/session
        metadata only. Hardware reconnect still requires explicit
        user action.
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
