import type { GraphDocument, GraphNode } from "../types/graph";

export type SearchResult = {
  node: GraphNode;
  score: number;
  matchedFields: string[];
};

export function searchNodes(document: GraphDocument, query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return document.nodes
    .map((node) => {
      const fields = [
        ["title", node.title],
        ["labels", node.labels.join(" ")],
        ["tags", node.tags.join(" ")],
        ["article", node.content.markdown],
      ] as const;
      const matchedFields = fields
        .filter(([, value]) => value.toLowerCase().includes(normalizedQuery))
        .map(([field]) => field);

      const titleBoost = node.title.toLowerCase().includes(normalizedQuery) ? 3 : 0;
      return { node, score: matchedFields.length + titleBoost, matchedFields };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.node.title.localeCompare(b.node.title));
}
