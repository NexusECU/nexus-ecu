import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Cpu,
  Radio,
  Route,
  ShieldCheck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  buildVehicleConnectionFlow,
} from "./vehicleConnectionFlowService";

import type {
  VehicleConnectionStage,
} from "./vehicleConnectionFlowTypes";

import "./guided-vehicle-connection-flow.css";

type Props = {
  adapterDetected:
    boolean;

  linkConnected:
    boolean;

  canMonitorActive:
    boolean;

  framesObserved:
    number;

  diagnosticResponderReady:
    boolean;

  identityReady:
    boolean;

  onOpenIdentification:
    () => void;

  onOpenDiagnostics:
    () => void;

  onOpenSession:
    () => void;
};

export function GuidedVehicleConnectionFlow({
  adapterDetected,
  linkConnected,
  canMonitorActive,
  framesObserved,
  diagnosticResponderReady,
  identityReady,
  onOpenIdentification,
  onOpenDiagnostics,
  onOpenSession,
}: Props) {
  const [
    sessionStarted,
    setSessionStarted,
  ] = useState(
    false,
  );

  const flow =
    useMemo(
      () =>
        buildVehicleConnectionFlow(
          adapterDetected,
          linkConnected,
          canMonitorActive,
          framesObserved,
          diagnosticResponderReady,
          identityReady,
          sessionStarted,
        ),
      [
        adapterDetected,
        linkConnected,
        canMonitorActive,
        framesObserved,
        diagnosticResponderReady,
        identityReady,
        sessionStarted,
      ],
    );

  return (
    <section className="guided-vehicle-flow">
      <div className="guided-vehicle-flow-header">
        <div>
          <Route
            size={16}
          />

          <div>
            <span className="eyebrow">
              GUIDED VEHICLE CONNECTION
            </span>

            <h3>
              Connect → Detect → Identify → Session
            </h3>
          </div>
        </div>

        <div
          className={`guided-vehicle-flow-result ${
            flow.ready
              ? "ready"
              : "waiting"
          }`}
        >
          {flow.ready ? (
            <CheckCircle2
              size={13}
            />
          ) : (
            <CircleHelp
              size={13}
            />
          )}

          {flow.ready
            ? "READY"
            : `${flow.progress}%`}
        </div>
      </div>

      <div className="guided-vehicle-flow-progress">
        <div>
          <span
            style={{
              width:
                `${flow.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="guided-vehicle-flow-stages">
        {flow.stages.map(
          (
            stage,
            index,
          ) => (
            <Stage
              key={
                stage.id
              }
              stage={
                stage
              }
              index={
                index +
                1
              }
            />
          ),
        )}
      </div>

      <div className="guided-vehicle-flow-actions">
        <button
          type="button"
          onClick={
            onOpenDiagnostics
          }
        >
          <Radio
            size={12}
          />

          CHECK HARDWARE
        </button>

        <button
          type="button"
          disabled={
            !adapterDetected ||
            !linkConnected
          }
          onClick={
            onOpenIdentification
          }
        >
          <Cpu
            size={12}
          />

          OPEN IDENTIFICATION
        </button>

        <button
          type="button"
          disabled={
            !diagnosticResponderReady
          }
          onClick={() => {
            setSessionStarted(
              true,
            );

            onOpenSession();
          }}
        >
          <ShieldCheck
            size={12}
          />

          START READ-ONLY SESSION
        </button>
      </div>

      <div
        className={`guided-vehicle-flow-message ${
          flow.ready
            ? "ready"
            : ""
        }`}
      >
        {flow.ready ? (
          <CheckCircle2
            size={13}
          />
        ) : (
          <CircleAlert
            size={13}
          />
        )}

        <div>
          <strong>
            {flow.ready
              ? "VEHICLE CONNECTION FLOW COMPLETE"
              : "CURRENT BLOCK"}
          </strong>

          <span>
            {flow.ready
              ? "The read-only ECU workspace is ready."
              : flow.blockedReason ??
                "Waiting for the next stage."}
          </span>
        </div>
      </div>
    </section>
  );
}

function Stage({
  stage,
  index,
}: {
  stage:
    VehicleConnectionStage;

  index:
    number;
}) {
  return (
    <div
      className={`guided-vehicle-stage ${stage.state}`}
    >
      <div className="guided-vehicle-stage-number">
        {stage.state ===
        "complete" ? (
          <CheckCircle2
            size={15}
          />
        ) : (
          <span>
            {index}
          </span>
        )}
      </div>

      <div>
        <strong>
          {stage.label}
        </strong>

        <span>
          {stage.detail}
        </span>
      </div>
    </div>
  );
}
