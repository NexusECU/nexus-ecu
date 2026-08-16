import {
  Activity,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  CircleHelp,
  Cpu,
  Network,
} from "lucide-react";

import {
  useMemo,
} from "react";

import type {
  CanFrame,
} from "./canParser";

import {
  buildVehicleDetectionSnapshot,
} from "./vehicleDetectionService";

import type {
  DetectionField,
} from "./vehicleDetectionTypes";

import "./vehicle-ecu-detection.css";

type Props = {
  frames:
    CanFrame[];

  vin:
    string | null;

  calibrationIds:
    string[];

  cvns:
    string[];

  ecuNames:
    string[];

  bitrateKbps:
    number | null;
};

export function VehicleEcuDetectionWorkspace({
  frames,
  vin,
  calibrationIds,
  cvns,
  ecuNames,
  bitrateKbps,
}: Props) {
  const snapshot =
    useMemo(
      () =>
        buildVehicleDetectionSnapshot(
          frames,
          vin,
          calibrationIds,
          cvns,
          ecuNames,
          bitrateKbps,
        ),
      [
        frames,
        vin,
        calibrationIds,
        cvns,
        ecuNames,
        bitrateKbps,
      ],
    );

  return (
    <section className="vehicle-detection">
      <div className="vehicle-detection-header">
        <div>
          <CarFront
            size={16}
          />

          <div>
            <span className="eyebrow">
              VEHICLE & ECU DETECTION · V7.7
            </span>

            <h3>
              Vehicle → Network → ECU → Calibration
            </h3>
          </div>
        </div>

        <strong>
          EVIDENCE-BASED IDENTIFICATION
        </strong>
      </div>

      <div className="vehicle-detection-flow">
        <Stage
          icon={<CarFront size={13}/>}
          title="VEHICLE"
          fields={
            snapshot.vehicle
          }
        />

        <Stage
          icon={<Network size={13}/>}
          title="NETWORK"
          fields={
            snapshot.network
          }
        />

        <Stage
          icon={<Cpu size={13}/>}
          title="ECU"
          fields={
            snapshot.ecu
          }
        />

        <Stage
          icon={<BadgeCheck size={13}/>}
          title="CALIBRATION"
          fields={
            snapshot.calibration
          }
        />
      </div>

      <div className="vehicle-detection-legend">
        <Legend
          className="detected"
          label="DETECTED"
          detail="Directly observed/decoded data"
        />

        <Legend
          className="inferred"
          label="INFERRED"
          detail="Reasonable conclusion from observed traffic"
        />

        <Legend
          className="unknown"
          label="UNKNOWN"
          detail="Insufficient evidence"
        />
      </div>
    </section>
  );
}

function Stage({
  icon,
  title,
  fields,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  fields:
    DetectionField[];
}) {
  return (
    <div className="vehicle-detection-stage">
      <div className="vehicle-detection-stage-title">
        {icon}

        <strong>
          {title}
        </strong>
      </div>

      {fields.map(
        item => (
          <div
            key={
              item.label
            }
            className={`vehicle-detection-field ${item.confidence}`}
          >
            <div>
              {item.confidence ===
              "detected" ? (
                <CheckCircle2 size={12}/>
              ) : item.confidence ===
                "inferred" ? (
                <Activity size={12}/>
              ) : (
                <CircleHelp size={12}/>
              )}
            </div>

            <div>
              <span>
                {item.label}
              </span>

              <strong>
                {item.value}
              </strong>

              <em>
                {item.evidence}
              </em>
            </div>

            <b>
              {item.confidence.toUpperCase()}
            </b>
          </div>
        ),
      )}
    </div>
  );
}

function Legend({
  className,
  label,
  detail,
}: {
  className:
    string;

  label:
    string;

  detail:
    string;
}) {
  return (
    <div className={className}>
      <strong>
        {label}
      </strong>

      <span>
        {detail}
      </span>
    </div>
  );
}
