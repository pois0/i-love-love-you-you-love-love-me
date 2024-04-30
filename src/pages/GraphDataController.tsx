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
    iterations: 500,
  });

  useEffect(() => {
    const g = new Graph();
    const drawing = (mode == "COUNT" ? CountMode : ScoreMode)(dataset.users.length);

    dataset.users.forEach(({ name, id }) => {
      g.addNode(userNodeId(id), {
        nodeType: "User",
        label: name,
        x: Math.random(),
        y: Math.random(),
        size: 25,
        color: "#89709c",
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

    const stdScore = count == 0 ? 0 : sum / 4 / count + 0.5;
    const baseColor = scoreColors(stdScore);

    const reviewerGrad = chroma
        .scale([
          chroma.lch(lightness, 0, baseColor.lch()[2]),
          baseColor
        ])
        .mode("lch");

    return {
      color: reviewerGrad(count / scores.length ** (0.25)).name(),
      radius: 5 + 40 * ((scores.length / userLen) ** 3),
    };
  };
}

const lightness = 50;
const chromaty = 130;
const scoreColors = chroma
    .scale([
      chroma.lch(lightness, chromaty, 40),
      chroma.lch(lightness, chromaty, 135),
    ])
    .mode("lch");
