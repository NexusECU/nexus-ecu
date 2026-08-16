import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  Search,
  Star,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  CalibrationDefinition,
} from "./calibrationDefinitionTypes";

import "./definition-browser.css";

type Props = {
  definitions: CalibrationDefinition[];
  activeDefinitionId: string;
  favouriteIds: string[];
  onSelect: (id: string) => void;
  onToggleFavourite: (id: string) => void;
};

export function DefinitionBrowser({
  definitions,
  activeDefinitionId,
  favouriteIds,
  onSelect,
  onToggleFavourite,
}: Props) {
  const [query, setQuery] =
    useState("");

  const groups =
    useMemo(() => {
      const needle =
        query.trim().toLowerCase();

      const filtered =
        needle
          ? definitions.filter(
              (definition) =>
                `${definition.name} ${definition.category} ${definition.description} ${definition.address}`
                  .toLowerCase()
                  .includes(needle),
            )
          : definitions;

      const grouped =
        new Map<
          string,
          CalibrationDefinition[]
        >();

      filtered.forEach(
        (definition) => {
          const items =
            grouped.get(
              definition.category,
            ) ?? [];

          items.push(
            definition,
          );

          grouped.set(
            definition.category,
            items,
          );
        },
      );

      return Array.from(
        grouped.entries(),
      );
    }, [
      definitions,
      query,
    ]);

  return (
    <aside className="definition-browser">
      <div className="ecuflash-pane-title">
        ROM Documents
      </div>

      <div className="ecuflash-rom-document">
        <FileCode2 size={13} />
        <span>NEXUS_Current_ROM.bin</span>
      </div>

      <div className="ecuflash-pane-title">
        Current ROM Metadata
      </div>

      <div className="definition-search">
        <Search size={12} />
        <input
          value={query}
          placeholder="Search maps, scalars, switches…"
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
        />
      </div>

      <div className="definition-tree">
        <div className="definition-root">
          <ChevronDown size={10} />
          <Folder size={11} />
          <strong>ECU Calibration</strong>
        </div>

        {groups.map(
          ([category, items]) => (
            <div
              key={category}
              className="definition-group"
            >
              <div className="definition-folder">
                <ChevronDown size={10} />
                <Folder size={11} />
                <span>{category}</span>
              </div>

              {items.map(
                (definition) => {
                  const active =
                    definition.id ===
                    activeDefinitionId;

                  const favourite =
                    favouriteIds.includes(
                      definition.id,
                    );

                  return (
                    <button
                      type="button"
                      key={definition.id}
                      className={`definition-item ${
                        active ? "active" : ""
                      }`}
                      onClick={() =>
                        onSelect(
                          definition.id,
                        )
                      }
                    >
                      <span />

                      <span className="definition-copy">
                        <strong>
                          {definition.name}
                        </strong>
                        <small>
                          {definition.type}
                          {" · "}
                          {definition.address}
                        </small>
                      </span>

                      <span
                        className={`definition-favourite ${
                          favourite
                            ? "active"
                            : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleFavourite(
                            definition.id,
                          );
                        }}
                      >
                        <Star size={11} />
                      </span>

                      <ChevronRight size={10} />
                    </button>
                  );
                },
              )}
            </div>
          ),
        )}
      </div>
    </aside>
  );
}
