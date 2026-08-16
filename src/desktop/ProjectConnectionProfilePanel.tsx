import {
  Cable,
  CheckCircle2,
  CircleAlert,
  PlugZap,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  VehicleProjectProfile,
} from "./vehicleProjectTypes";

import type {
  TransportProviderId,
} from "../hardware/transportTypes";

import {
  deleteProjectConnectionProfile,
  getProjectConnectionProfile,
  markProjectConnectionSuccessful,
  saveProjectConnectionProfile,
} from "./projectConnectionProfileService";

import type {
  ProjectConnectionProfile,
} from "./projectConnectionProfileTypes";

import "./project-connection-profile.css";

type Props = {
  activeProject:
    VehicleProjectProfile | null;

  providerId:
    TransportProviderId;

  serialPort:
    string;

  serialBaud:
    number;

  canBitrateKbps:
    number;

  linkConnected:
    boolean;

  onApplyProfile: (
    profile:
      ProjectConnectionProfile,
  ) => void;

  onReconnect: (
    profile:
      ProjectConnectionProfile,
  ) => void;
};

export function ProjectConnectionProfilePanel({
  activeProject,
  providerId,
  serialPort,
  serialBaud,
  canBitrateKbps,
  linkConnected,
  onApplyProfile,
  onReconnect,
}: Props) {
  const [
    savedProfile,
    setSavedProfile,
  ] = useState<
    ProjectConnectionProfile | null
  >(
    null,
  );

  const projectId =
    activeProject?.id ??
    null;

  useEffect(
    () => {
      if (!projectId) {
        setSavedProfile(
          null,
        );

        return;
      }

      setSavedProfile(
        getProjectConnectionProfile(
          projectId,
        ),
      );
    },
    [
      projectId,
    ],
  );

  useEffect(
    () => {
      if (
        !projectId ||
        !linkConnected
      ) {
        return;
      }

      const updated =
        markProjectConnectionSuccessful(
          projectId,
        );

      if (updated) {
        setSavedProfile(
          updated,
        );
      }
    },
    [
      projectId,
      linkConnected,
    ],
  );

  const currentMatches =
    useMemo(
      () => {
        if (
          !savedProfile
        ) {
          return false;
        }

        return (
          savedProfile.providerId ===
            providerId &&
          savedProfile.serialPort ===
            serialPort &&
          savedProfile.serialBaud ===
            serialBaud &&
          savedProfile.canBitrateKbps ===
            canBitrateKbps
        );
      },
      [
        savedProfile,
        providerId,
        serialPort,
        serialBaud,
        canBitrateKbps,
      ],
    );

  if (!activeProject) {
    return (
      <section className="project-connection-profile">
        <div className="project-connection-profile-empty">
          Open or create a vehicle project to save a connection
          profile.
        </div>
      </section>
    );
  }

  const saveCurrent =
    () => {
      const now =
        new Date()
          .toISOString();

      const next =
        saveProjectConnectionProfile({
          projectId:
            activeProject.id,

          providerId,

          serialPort,

          serialBaud,

          canBitrateKbps,

          j2534DeviceName:
            null,

          j2534FunctionLibrary:
            null,

          lastSuccessfulAt:
            linkConnected
              ? now
              : savedProfile?.lastSuccessfulAt ??
                null,

          createdAt:
            savedProfile?.createdAt ??
            now,

          updatedAt:
            now,
        });

      setSavedProfile(
        next,
      );
    };

  const clear =
    () => {
      deleteProjectConnectionProfile(
        activeProject.id,
      );

      setSavedProfile(
        null,
      );
    };

  return (
    <section className="project-connection-profile">
      <div className="project-connection-profile-header">
        <div>
          <Cable
            size={16}
          />

          <div>
            <span className="eyebrow">
              ECU CONNECTION PROFILE · V9.1
            </span>

            <h3>
              {activeProject.name}
            </h3>
          </div>
        </div>

        <div
          className={`project-connection-profile-state ${
            savedProfile
              ? currentMatches
                ? "matched"
                : "saved"
              : "empty"
          }`}
        >
          {savedProfile ? (
            <CheckCircle2
              size={12}
            />
          ) : (
            <CircleAlert
              size={12}
            />
          )}

          {savedProfile
            ? currentMatches
              ? "PROFILE MATCHED"
              : "SAVED PROFILE AVAILABLE"
            : "NO PROFILE"}
        </div>
      </div>

      <div className="project-connection-profile-grid">
        <Info
          label="PROVIDER"
          value={
            savedProfile?.providerId.toUpperCase() ??
            "NONE"
          }
        />

        <Info
          label="SERIAL PORT"
          value={
            savedProfile?.serialPort ||
            "NONE"
          }
        />

        <Info
          label="SERIAL BAUD"
          value={
            savedProfile
              ? String(
                  savedProfile.serialBaud,
                )
              : "NONE"
          }
        />

        <Info
          label="CAN BITRATE"
          value={
            savedProfile
              ? `${savedProfile.canBitrateKbps} KBIT/S`
              : "NONE"
          }
        />

        <Info
          label="LAST SUCCESS"
          value={
            savedProfile?.lastSuccessfulAt
              ? new Date(
                  savedProfile.lastSuccessfulAt,
                ).toLocaleString()
              : "NEVER"
          }
        />

        <Info
          label="LINK"
          value={
            linkConnected
              ? "CONNECTED"
              : "DISCONNECTED"
          }
        />
      </div>

      <div className="project-connection-profile-actions">
        <button
          type="button"
          onClick={
            saveCurrent
          }
        >
          <Save
            size={12}
          />

          SAVE CURRENT CONNECTION PROFILE
        </button>

        <button
          type="button"
          disabled={
            !savedProfile
          }
          onClick={() => {
            if (
              savedProfile
            ) {
              onApplyProfile(
                savedProfile,
              );
            }
          }}
        >
          <RotateCcw
            size={12}
          />

          APPLY SAVED SETTINGS
        </button>

        <button
          type="button"
          disabled={
            !savedProfile ||
            linkConnected
          }
          onClick={() => {
            if (
              savedProfile
            ) {
              onReconnect(
                savedProfile,
              );
            }
          }}
        >
          <PlugZap
            size={12}
          />

          RECONNECT USING PROFILE
        </button>

        <button
          type="button"
          className="danger"
          disabled={
            !savedProfile
          }
          onClick={
            clear
          }
        >
          <Trash2
            size={12}
          />

          DELETE PROFILE
        </button>
      </div>

      <div className="project-connection-profile-note">
        v9.1 remembers the known-good connection configuration
        per vehicle project. Reconnect is user-initiated; NEXUS
        does not silently open a COM/J2534 interface when a
        project is loaded.
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
