import {
  Eye,
  EyeOff,
  Image,
  Layers,
  MapPin,
  Minus,
  Pentagon,
  Table,
  Filter,
} from "lucide-react";
import {
  useFelt,
  useLayers,
  useLiveLayer,
  useLiveLayerGroup,
} from "../utils/feltUtils";

export function LayersList() {
  const layers = useLayers();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* <h2 className="p-3 py-2 font-bold">Layers</h2> */}
      <hr className="border-gray-200" />
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {!layers && (
          <div className="flex justify-center my-8">
            <div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div>
          </div>
        )}
        {layers &&
          layers.map((n) => {
            if (n.type === "layer") {
              return <LayerItem layer={n.layer} key={n.layer.id} />;
            }
            return (
              <LayerGroupItem
                group={n.group}
                layers={n.layers}
                key={n.group.id}
              />
            );
          })}
      </div>
    </div>
  );
}

function LayerGroupItem({ group: initialGroup, layers }) {
  const felt = useFelt();
  const group = useLiveLayerGroup(felt, initialGroup);
  if (!group) return null;

  return (
    <div className={`flex flex-col ${group.visible ? "" : "opacity-40"}`}>
      <div className="flex items-center p-3 py-2 group">
        <h3 className="flex-1 truncate font-bold">{group.name}</h3>
        <button
          className="invisible group-hover:visible p-1 hover:bg-gray-100 rounded"
          onClick={() => {
            if (group.visible) {
              felt.setLayerGroupVisibility({ hide: [group.id] });
            } else {
              felt.setLayerGroupVisibility({ show: [group.id] });
            }
          }}
          aria-label={group.visible ? "Hide layer group" : "Show layer group"}
        >
          {group.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>
      {group.visible && (
        <div className="flex flex-col">
          {layers.map((l) => (
            <LayerItem layer={l} key={l.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function LayerItem({ layer }) {
  const felt = useFelt();
  const currentLayer = useLiveLayer(felt, layer);
  if (!currentLayer) return null;

  const Icon = (function (type) {
    switch (type) {
      case "Polygon":
        return Pentagon;
      case "Point":
        return MapPin;
      case "Line":
        return Minus;
      case "Raster":
        return Image;
      default:
        return Layers;
    }
  })(currentLayer.geometryType);

  const applyAreaFilter = () => {
    felt.setLayerFilters({
      layerId: currentLayer.id,
      filters: [
        ["area", "gt", 4047], // Greater than 1 acre (4047 sq meters)
        "and",
        ["area", "lt", 20235], // Less than 5 acres (20235 sq meters)
      ],
    });
  };

  const clearFilters = () => {
    felt.setLayerFilters({
      layerId: currentLayer.id,
      filters: null,
    });
  };

  return (
    <div
      className={`flex items-start p-3 group ${
        currentLayer.visible ? "" : "opacity-40"
      }`}
      id={currentLayer.id}
      onDoubleClick={() => {
        if (currentLayer.bounds) {
          felt.fitViewportToBounds({ bounds: currentLayer.bounds });
        }
      }}
    >
      <Icon className="w-4 h-4 mt-1 flex-shrink-0" />
      <div className="ml-2 flex-1 overflow-hidden">
        <p className={`truncate ${!currentLayer.name && "text-gray-500"}`}>
          {currentLayer.name || "(No name)"}
        </p>
        {currentLayer.caption && (
          <p className="text-gray-500">{currentLayer.caption}</p>
        )}
      </div>
      <div className="flex gap-1">
        <button
          className="invisible group-hover:visible p-1 hover:bg-gray-100 rounded"
          aria-label="Filter layer"
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
          onClick={applyAreaFilter}
          onContextMenu={(e) => {
            e.preventDefault();
            clearFilters();
          }}
          title="Click to filter 1-5 acres, Right-click to clear"
        >
          <Filter className="w-4 h-4" />
        </button>
        <button
          className="invisible group-hover:visible p-1 hover:bg-gray-100 rounded"
          aria-label="Show data table"
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            felt.showLayerDataTable({
              layerId: currentLayer.id,
            });
          }}
        >
          <Table className="w-4 h-4" />
        </button>
        <button
          className="invisible group-hover:visible p-1 hover:bg-gray-100 rounded"
          aria-label={currentLayer.visible ? "Hide layer" : "Show layer"}
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            if (currentLayer.visible) {
              felt.setLayerVisibility({ hide: [currentLayer.id] });
            } else {
              felt.setLayerVisibility({ show: [currentLayer.id] });
            }
          }}
        >
          {currentLayer.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
