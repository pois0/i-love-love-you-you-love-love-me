import { Attributes } from "graphology-types";

export type NodeType = "Anime" | "User";

export function userNodeId(userId: number): number {
  return -userId;
}

export function animeNodeId(animeId: number): number {
  return animeId;
}

export function getNodeType(attr: Attributes): NodeType {
  return attr.nodeType as NodeType;
}
