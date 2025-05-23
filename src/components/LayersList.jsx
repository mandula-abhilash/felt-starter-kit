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
import * as Slider from "@radix-ui/react-slider";
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
  const [range, setRange] = React.useState([0, 70000]);

  React.useEffect(() => {
    const fetchFilters = async () => {
      const layerFilters = await felt.getLayerFilters(currentLayer.id);
      setFilters(layerFilters);

      if (layerFilters?.combined) {
        const minFilter = layerFilters.combined[0];
        const maxFilter = layerFilters.combined[2];
        if (minFilter && maxFilter) {
          setRange([minFilter[2], maxFilter[2]]);
        }
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
    setRange([0, 70000]);
  };

  const applyAreaFilter = async (newRange) => {
    const filters = [
      ["Area_ha", "ge", newRange[0]],
      "and",
      ["Area_ha", "le", newRange[1]],
    ];

    await felt.setLayerFilters({
      layerId: currentLayer.id,
      filters: filters,
    });

    const newFilters = await felt.getLayerFilters(currentLayer.id);
    setFilters(newFilters);
  };

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    applyAreaFilter(newRange);
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Area Range (ha)
              </label>
              {filters && (
                <button
                  onClick={clearFilters}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={range}
              onValueChange={handleRangeChange}
              min={0}
              max={70000}
              step={1}
            >
              <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Min area"
              />
              <Slider.Thumb
                className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Max area"
              />
            </Slider.Root>

            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={range[0]}
                  onChange={(e) =>
                    handleRangeChange([Number(e.target.value), range[1]])
                  }
                  placeholder="Min"
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={range[1]}
                  onChange={(e) =>
                    handleRangeChange([range[0], Number(e.target.value)])
                  }
                  placeholder="Max"
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Display active filters */}
          {filters?.combined && (
            <div className="text-sm text-gray-600">
              <p className="font-medium">Active Filter:</p>
              <div className="flex items-center gap-1 mt-1">
                <span>{range[0]} ha</span>
                <span>≤</span>
                <span>Area</span>
                <span>≤</span>
                <span>{range[1]} ha</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
