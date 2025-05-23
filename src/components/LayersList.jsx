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
  Search,
  X,
} from "lucide-react";
import {
  useFelt,
  useLayers,
  useLiveLayer,
  useLiveLayerGroup,
} from "../utils/feltUtils";
import React from "react";

export function LayersList() {
  const layers = useLayers();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
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
  const [filters, setFilters] = React.useState(null);
  const [areaFilter, setAreaFilter] = React.useState("");

  React.useEffect(() => {
    const fetchFilters = async () => {
      const layerFilters = await felt.getLayerFilters(currentLayer.id);
      setFilters(layerFilters);

      // Extract area filter value if it exists
      if (layerFilters?.ephemeral?.[2]) {
        const value = parseFloat(layerFilters.ephemeral[2]);
        setAreaFilter(value.toString());
      }
    };

    fetchFilters();
  }, [currentLayer.id]);

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

  const clearFilters = async () => {
    await felt.setLayerFilters({
      layerId: currentLayer.id,
      filters: null,
    });
    setFilters(null);
    setAreaFilter("");
  };

  const applyAreaFilter = async (value) => {
    setAreaFilter(value);
    if (value.trim()) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        await felt.setLayerFilters({
          layerId: currentLayer.id,
          filters: ["Area_ha", "gt", numericValue],
        });
        const newFilters = await felt.getLayerFilters(currentLayer.id);
        setFilters(newFilters);
      }
    } else {
      await clearFilters();
    }
  };

  return (
    <div
      className={`flex flex-col p-3 group ${
        currentLayer.visible ? "" : "opacity-40"
      }`}
      id={currentLayer.id}
      onDoubleClick={() => {
        if (currentLayer.bounds) {
          felt.fitViewportToBounds({ bounds: currentLayer.bounds });
        }
      }}
    >
      <div className="flex items-start">
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

      {/* Filter UI */}
      {currentLayer.name === "Green Belt" && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={areaFilter}
                onChange={(e) => applyAreaFilter(e.target.value)}
                placeholder="Filter by area (ha)..."
                className="w-full pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
              />
              <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {areaFilter && (
              <button
                onClick={clearFilters}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Display active filters */}
          {filters?.ephemeral && (
            <div className="text-sm text-gray-600">
              <p className="font-medium">Active Filter:</p>
              <div className="flex items-center gap-1 mt-1">
                <span>Area</span>
                <span>&gt;</span>
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {filters.ephemeral[2]} ha
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
