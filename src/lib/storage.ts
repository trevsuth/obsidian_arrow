import type { GraphDocument } from "../types/graph";
import { createEmptyDocument } from "./graphOps";

const STORAGE_KEY = "local-graph-wiki.document.v1";

export function loadDocument(): GraphDocument {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyDocument();
  }

  try {
    return JSON.parse(raw) as GraphDocument;
  } catch (error) {
    console.warn("Could not parse saved graph document.", error);
    return createEmptyDocument();
  }
}

export function saveDocument(document: GraphDocument): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}

export function clearSavedDocument(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportDocument(document: GraphDocument): string {
  return JSON.stringify(document, null, 2);
}

export function importDocument(raw: string): GraphDocument {
  const parsed = JSON.parse(raw) as GraphDocument;

  if (!parsed.id || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.relationships)) {
    throw new Error("Imported JSON does not look like a graph document.");
  }

  return parsed;
}
