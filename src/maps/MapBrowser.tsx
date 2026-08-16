import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  Gauge,
  Sparkles,
  Zap,
} from "lucide-react";

import type {
  EcuMap,
} from "./mapTypes";

import {
  mapDisplayName,
} from "./mapUtilities";

type MapBrowserProps = {
  maps: EcuMap[];

  activeMapId: string;

  onSelect: (
    mapId: string,
  ) => void;
};

function categoryForMap(
  map: EcuMap,
): {
  title: string;
  icon:
    React.ReactNode;
} {
  if (
    map.kind ===
    "fuel"
  ) {
    return {
      title:
        "Fueling",
      icon: (
        <Zap
          size={12}
        />
      ),
    };
  }

  if (
    map.kind ===
    "ignition"
  ) {
    return {
      title:
        "Ignition Timing",
      icon: (
        <Sparkles
          size={12}
        />
      ),
    };
  }

  return {
    title:
      "Boost Control",
    icon: (
      <Gauge
        size={12}
      />
    ),
  };
}

export function MapBrowser({
  maps,
  activeMapId,
  onSelect,
}: MapBrowserProps) {
  return (
    <aside className="tune-browser">
      <div className="ecuflash-pane-title">
        ROM Documents
      </div>

      <div className="ecuflash-rom-document">
        <FileCode2
          size={13}
        />

        <span>
          NEXUS_Current_ROM.bin
        </span>
      </div>

      <div className="ecuflash-pane-title">
        Current ROM Metadata
      </div>

      <div className="tune-browser-tree">
        <div className="ecuflash-tree-root">
          <ChevronDown
            size={11}
          />

          <Folder
            size={12}
          />

          <strong>
            ECU Calibration
          </strong>
        </div>

        {maps.map(
          (map) => {
            const category =
              categoryForMap(
                map,
              );

            const active =
              map.id ===
              activeMapId;

            return (
              <div
                key={
                  map.id
                }
                className="tune-tree-group"
              >
                <div className="tune-tree-folder">
                  <ChevronDown
                    size={10}
                  />

                  <Folder
                    size={11}
                  />

                  <span>
                    {category.title}
                  </span>
                </div>

                <button
                  type="button"
                  className={`tune-tree-map ${
                    active
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    onSelect(
                      map.id,
                    )
                  }
                >
                  <span className="tune-tree-indent" />

                  <span className="tune-tree-map-icon">
                    {category.icon}
                  </span>

                  <span className="tune-tree-map-copy">
                    <strong>
                      {mapDisplayName(
                        map,
                      )}
                    </strong>

                    <small>
                      {map.yAxis.values.length}
                      ×
                      {map.xAxis.values.length}
                      {""}
                      table
                    </small>
                  </span>

                  <ChevronRight
                    size={11}
                  />
                </button>
              </div>
            );
          },
        )}

        <div className="ecuflash-static-tree">
          <div>
            <ChevronRight size={10} />
            <Folder size={11} />
            <span>Limits</span>
          </div>

          <div>
            <ChevronRight size={10} />
            <Folder size={11} />
            <span>Scalings</span>
          </div>

          <div>
            <ChevronRight size={10} />
            <Folder size={11} />
            <span>Thresholds</span>
          </div>

          <div>
            <ChevronRight size={10} />
            <Folder size={11} />
            <span>Diagnostics</span>
          </div>
        </div>
      </div>

      <div className="tune-browser-footer">
        <span>
          ROM STATE
        </span>

        <strong>
          NEXUS CALIBRATION LOADED
        </strong>
      </div>
    </aside>
  );
}
