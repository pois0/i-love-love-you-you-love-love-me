import { useLoadGraph, useSigma } from "@react-sigma/core";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import chroma from "chroma-js";
import Graph from "graphology";
import React, { useEffect } from "react";

import { animeNodeId, userNodeId } from "./logic/graphUtils";
import { DataSet } from "./types";

export const GraphDataController: React.FC<{ dataset: DataSet }> = ({ dataset }) => {
  useSigma();
  const loadGraph = useLoadGraph();
  const { assign } = useLayoutForceAtlas2({
    iterations: 300,
  });

  useEffect(() => {
    const g = new Graph();

    const usercolors = chroma
      .scale([
        chroma(326, 0.42, 0.62, "hsl"),
        chroma(426, 0.42, 0.62, "hsl"),
      ])
      .mode("hsl")
      .colors(dataset.users.length);
    const animecolors = chroma
      .scale([
        chroma(206, 0.45, 0.40, "hsl"),
        chroma(226, 0.60, 0.75, "hsl"),
      ])
      .mode("hsl")
      .colors(dataset.users.length);
    dataset.users.forEach(({ name, id }, i) => {
      g.addNode(userNodeId(id), {
        nodeType: "User",
        label: name,
        x: Math.random(),
        y: Math.random(),
        size: 25,
        color: usercolors[i],
      });
    });
    dataset.animes.forEach(({ id, title, size }) => {
      g.addNode(animeNodeId(id), {
        nodeType: "Anime",
        label: title,
        x: Math.random(),
        y: Math.random(),
        size: 5 + (40 * ((size / dataset.users.length) ** 3)),
        color: animecolors[size - 1],
      });
    });
    dataset.statuses.forEach(({ animeId, userId, status }) => {
      g.addEdge(userNodeId(userId), animeNodeId(animeId), {
        label: status,
        size: status === "COMPLETED" ? 1 : 2,
      });
    });
    loadGraph(g);
    assign();
  }, [assign, loadGraph, dataset]);

  return null;
};

