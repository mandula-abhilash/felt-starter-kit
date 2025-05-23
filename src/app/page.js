"use client";

import React from "react";
import { LayersList } from "@/components/LayersList";
import {
  FeltContext,
  useFeltEmbed,
  LayersContext,
  assembleLayerTree,
} from "../utils/feltUtils";
import { ViewportInfo } from "@/components/ViewportInfo";

const Home = () => {
  // const { felt, mapRef } = useFeltEmbed("ZGqxKlVgR8eyiNfbVsYqxB", {
  const { felt, mapRef } = useFeltEmbed("H9BrbOgzvQJm9APPuYrG8xUC", {
    uiControls: {
      cooperativeGestures: false,
      fullScreenButton: false,
      showLegend: false,
    },
  });
  const [layers, setLayers] = React.useState(null);

  React.useEffect(() => {
    if (!felt) return;

    async function fetchLayersAndFilters() {
      const [layersRaw, layerGroupsRaw] = await Promise.all([
        felt.getLayers(),
        felt.getLayerGroups(),
      ]);

      const layers = layersRaw.filter(Boolean);
      const layerGroups = layerGroupsRaw.filter(Boolean);

      const tree = assembleLayerTree(layers, layerGroups);
      console.log("Layer Tree:", tree);

      // Fetch and log filters for each layer
      for (const layer of layers) {
        try {
          const filters = await felt.getLayerFilters(layer.id);
          console.log(
            `Filters for layer ${layer.id} (${layer.name}):`,
            filters
          );
        } catch (err) {
          console.error(`Failed to fetch filters for layer ${layer.id}:`, err);
        }
      }

      setLayers(tree);
    }

    fetchLayersAndFilters();
  }, [felt]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 flex-none border-r border-gray-200 overflow-hidden">
        <FeltSidebar felt={felt} layers={layers} />
      </div>
      <div
        className="flex-1 bg-gray-100 relative"
        ref={mapRef}
        style={{
          isolation: "isolate",
        }}
      >
        {!felt && (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div>
              <p className="text-sm text-gray-500">Loading map…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FeltSidebar = ({ felt, layers }) => {
  return (
    <div className="flex flex-col h-full text-md overflow-hidden">
      {felt ? (
        <FeltContext.Provider value={felt}>
          <LayersContext.Provider value={layers}>
            <div className="flex flex-col flex-1 overflow-hidden">
              <LayersList />
            </div>
            <div className="flex-none overflow-hidden">
              <ViewportInfo />
            </div>
          </LayersContext.Provider>
        </FeltContext.Provider>
      ) : (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      )}
    </div>
  );
};

export default Home;
