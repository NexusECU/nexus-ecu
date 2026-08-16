import {
  Database,
  FileSearch,
  Search,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CalibrationDefinition,
} from "../maps/calibrationDefinitionTypes";

import type {
  NexusDefinitionFile,
} from "../maps/definitionFileTypes";

import type {
  RomImageInfo,
} from "../rom/romTypes";

import {
  buildLocalDefinitionProfiles,
} from "./definitionProfileDatabase";

import {
  candidateToDefinition,
  discoverCandidateMaps,
  fingerprintRom,
  matchDefinitionProfiles,
} from "./romDiscoveryService";

import type {
  CandidateMap,
  DefinitionMatch,
  RomFingerprint,
} from "./definitionDatabaseTypes";

import "./definition-database.css";

type Props = {
  image:
    RomImageInfo | null;

  builtInDefinitions:
    CalibrationDefinition[];

  activeFile:
    NexusDefinitionFile | null;

  onAddDefinition: (
    definition:
      CalibrationDefinition,
  ) => void;
};

export function DefinitionDatabasePanel({
  image,
  builtInDefinitions,
  activeFile,
  onAddDefinition,
}: Props) {
  const [
    fingerprint,
    setFingerprint,
  ] = useState<
    RomFingerprint | null
  >(
    null,
  );

  const [
    matches,
    setMatches,
  ] = useState<
    DefinitionMatch[]
  >([]);

  const [
    candidates,
    setCandidates,
  ] = useState<
    CandidateMap[]
  >([]);

  const [
    searching,
    setSearching,
  ] = useState(
    false,
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const profiles =
    useMemo(
      () =>
        buildLocalDefinitionProfiles(
          builtInDefinitions,
        ),
      [
        builtInDefinitions,
      ],
    );

  useEffect(
    () => {
      let cancelled =
        false;

      const run =
        async () => {
          if (
            !image
          ) {
            setFingerprint(
              null,
            );

            setMatches(
              [],
            );

            return;
          }

          const next =
            await fingerprintRom(
              image.bytes,
            );

          if (
            cancelled
          ) {
            return;
          }

          setFingerprint(
            next,
          );

          setMatches(
            matchDefinitionProfiles(
              next,
              profiles,
            ),
          );
        };

      void run();

      return () => {
        cancelled =
          true;
      };
    },
    [
      image,
      profiles,
    ],
  );

  const runDiscovery =
    () => {
      if (
        !image
      ) {
        return;
      }

      setSearching(
        true,
      );

      window.setTimeout(
        () => {
          setCandidates(
            discoverCandidateMaps(
              image.bytes,
            ),
          );

          setSearching(
            false,
          );
        },
        0,
      );
    };

  const filteredProfiles =
    profiles.filter(
      (profile) =>
        `${profile.name} ${profile.vendor} ${profile.ecuFamily} ${profile.romId}`
          .toLowerCase()
          .includes(
            query
              .trim()
              .toLowerCase(),
          ),
    );

  return (
    <section className="definition-database">
      <div className="definition-database-header">
        <div>
          <Database
            size={15}
          />

          <div>
            <span className="eyebrow">
              ROM DATABASE & DISCOVERY
            </span>

            <h3>
              Definition Database
            </h3>
          </div>
        </div>

        <strong>
          OFFLINE FINGERPRINTING / CANDIDATE ANALYSIS
        </strong>
      </div>

      <div className="definition-database-search">
        <Search
          size={12}
        />

        <input
          value={
            query
          }
          placeholder="Search ECU / ROM profiles…"
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
        />
      </div>

      <div className="definition-database-profiles">
        {filteredProfiles.map(
          (profile) => {
            const match =
              matches.find(
                (item) =>
                  item.profileId ===
                  profile.id,
              );

            return (
              <div
                key={
                  profile.id
                }
                className="definition-profile-card"
              >
                <div>
                  <strong>
                    {profile.name}
                  </strong>

                  <span>
                    {profile.vendor}
                    {" · "}
                    {profile.ecuFamily}
                    {" · "}
                    {profile.romId}
                  </span>
                </div>

                <div className="definition-profile-score">
                  {match
                    ? `${match.score}%`
                    : "—"}
                </div>
              </div>
            );
          },
        )}
      </div>

      {fingerprint ? (
        <div className="definition-fingerprint">
          <div>
            <span>
              ROM SIZE
            </span>

            <strong>
              {fingerprint.sizeBytes.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>
              SHA-256 PREFIX
            </span>

            <strong>
              {fingerprint.sha256Prefix}
            </strong>
          </div>

          <div>
            <span>
              ENTROPY
            </span>

            <strong>
              {fingerprint.entropyEstimate.toFixed(
                3,
              )}
            </strong>
          </div>

          <div>
            <span>
              00 / FF RATIO
            </span>

            <strong>
              {(fingerprint.zeroByteRatio *
                100).toFixed(
                1,
              )}
              %
              {" / "}
              {(fingerprint.ffByteRatio *
                100).toFixed(
                1,
              )}
              %
            </strong>
          </div>
        </div>
      ) : (
        <div className="definition-database-empty">
          Load a ROM image to calculate a fingerprint and
          score local definition profiles.
        </div>
      )}

      <div className="definition-discovery-toolbar">
        <button
          type="button"
          disabled={
            !image ||
            searching
          }
          onClick={
            runDiscovery
          }
        >
          <FileSearch
            size={13}
          />

          {searching
            ? "SCANNING…"
            : "SCAN FOR TABLE CANDIDATES"}
        </button>

        <span>
          {candidates.length}
          {""}
          CANDIDATES
        </span>
      </div>

      {candidates.length >
      0 && (
        <div className="definition-candidate-table-shell">
          <table className="definition-candidate-table">
            <thead>
              <tr>
                <th>
                  OFFSET
                </th>
                <th>
                  SHAPE
                </th>
                <th>
                  TYPE
                </th>
                <th>
                  ENDIAN
                </th>
                <th>
                  RANGE
                </th>
                <th>
                  SMOOTH
                </th>
                <th>
                  CONFIDENCE
                </th>
                <th>
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody>
              {candidates.map(
                (candidate) => (
                  <tr
                    key={
                      candidate.id
                    }
                  >
                    <td>
                      0x
                      {candidate.offset
                        .toString(
                          16,
                        )
                        .toUpperCase()
                        .padStart(
                          6,
                          "0",
                        )}
                    </td>

                    <td>
                      {candidate.rows}
                      ×
                      {candidate.columns}
                    </td>

                    <td>
                      {candidate.dataType}
                    </td>

                    <td>
                      {candidate.endian}
                    </td>

                    <td>
                      {candidate.min}
                      {" → "}
                      {candidate.max}
                    </td>

                    <td>
                      {(candidate.smoothness *
                        100).toFixed(
                        1,
                      )}
                      %
                    </td>

                    <td>
                      {candidate.score.toFixed(
                        1,
                      )}
                      %
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          onAddDefinition(
                            candidateToDefinition(
                              candidate,
                            ),
                          )
                        }
                      >
                        <Sparkles
                          size={11}
                        />

                        ADD TO STUDIO
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeFile && (
        <div className="definition-database-active">
          ACTIVE DEFINITION:
          {""}
          <strong>
            {activeFile.name}
          </strong>
          {" · "}
          {activeFile.romId}
        </div>
      )}
    </section>
  );
}
