import { useLoadGraph, useSigma } from "@react-sigma/core";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import chroma from "chroma-js";
import Graph from "graphology";
import React, { useEffect } from "react";

import { animeNodeId, userNodeId } from "./logic/graphUtils";
import { DataSet, DrawMode, Optional } from "./types";

export const GraphDataController: React.FC<{ dataset: DataSet, mode: DrawMode}> = ({ dataset, mode }) => {
  useSigma();
  const loadGraph = useLoadGraph();
  const { assign } = useLayoutForceAtlas2({
    iterations: 300,
  });

  useEffect(() => {
    const g = new Graph();
    const drawing = (mode == "COUNT" ? CountMode : ScoreMode)(dataset.users.length);

    const usercolors = chroma
      .scale([
        chroma(326, 0.42, 0.62, "hsl"),
        chroma(426, 0.42, 0.62, "hsl"),
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
    dataset.animes.forEach(({ id, title, scores }) => {
      const info = drawing(scores);
      g.addNode(animeNodeId(id), {
        nodeType: "Anime",
        label: title,
        x: Math.random(),
        y: Math.random(),
        size: info.radius,
        color: info.color,
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
  }, [assign, loadGraph, dataset, mode]);

  return null;
};

type NodeDrawingConfig = (scores: Optional<number>[]) => { color: string, radius: number };

function CountMode(userLen: number): NodeDrawingConfig {
    const animeColors = chroma
      .scale([
        chroma(206, 0.45, 0.40, "hsl"),
        chroma(226, 0.60, 0.75, "hsl"),
      ])
      .mode("hsl")
      .colors(userLen);

    return (scores) => ({
      color: animeColors[scores.length - 1],
      radius: 5 + 40 * ((scores.length / userLen) ** 3),
    });
}

function ScoreMode(userLen: number): NodeDrawingConfig {
  function cutScores(score: number): number {
    return Math.min(Math.max(score, -2), 2)
  }

  return (scores) => {
    let sum = 0;
    let count = 0;
    for (const score of scores) {
      if (score == null) continue;
      count++;
      sum += cutScores(score);
    }

    if (count === 0) {
      return {
        color: "#768894",
        radius: 5 + 40 * ((scores.length / userLen) ** 3),
      }
    }

    const stdScore = sum / 4 / count + 0.5;

    return {
      color: colors(stdScore).name(),
      radius: 5 + 40 * ((scores.length / userLen) ** 3),
    }
  };
}

const colors = chroma
    .scale([
      chroma("#dd3e54"),
      chroma("#6be585"),
    ]);
