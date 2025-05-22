"use client";

import { Felt } from "@feltmaps/js-sdk";
import React from "react";

export function useFeltEmbed(mapId, embedOptions) {
  const [felt, setFelt] = React.useState(null);
  const hasLoadedRef = React.useRef(false);
  const mapRef = React.useRef(null);

  React.useEffect(() => {
    async function loadFelt() {
      if (hasLoadedRef.current) return;
      if (!mapRef.current) return;

      hasLoadedRef.current = true;
      const felt = await Felt.embed(mapRef.current, mapId, embedOptions);
      setFelt(felt);
    }

    loadFelt();
  }, []);

  return {
    felt,
    mapRef,
  };
}

export const FeltContext = React.createContext(null);
export const useFelt = () => React.useContext(FeltContext);

export function useLiveLayerGroup(felt, initialGroup) {
  const [currentGroup, setGroup] = React.useState(initialGroup);

  React.useEffect(() => {
    return felt.onLayerGroupChange({
      options: { id: initialGroup.id },
      handler: ({ layerGroup }) => setGroup(layerGroup),
    });
  }, [initialGroup.id]);

  return currentGroup;
}

export function useLiveLayer(felt, initialLayer) {
  const [currentLayer, setLayer] = React.useState(initialLayer);

  React.useEffect(() => {
    return felt.onLayerChange({
      options: { id: initialLayer.id },
      handler: ({ layer }) => setLayer(layer),
    });
  }, [initialLayer.id]);

  return currentLayer;
}

export function assembleLayerTree(layers, layerGroups) {
  const groupsById = new Map();
  const result = [];
  for (const layer of layers) {
    if (!layer.groupId) {
      result.push({
        type: "layer",
        layer,
      });
    } else {
      const group = groupsById.get(layer.groupId);
      if (!group) {
        const node = {
          type: "layerGroup",
          group: layerGroups.find((g) => g.id === layer.groupId),
          layers: [layer],
        };

        groupsById.set(layer.groupId, node);
        result.push(groupsById.get(layer.groupId));
      } else {
        group.layers.push(layer);
      }
    }
  }
  return result;
}
