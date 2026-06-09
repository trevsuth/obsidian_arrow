import type { GraphNode, GraphRelationship, NodeContentType } from "../types/graph";
import {
  createAttachmentFromFile,
  parseListInput,
  stringifyListInput,
  updateNodeContent,
} from "../lib/graphOps";
import MarkdownEditor from "./MarkdownEditor";

type InspectorPanelProps = {
  selectedNode?: GraphNode;
  selectedRelationship?: GraphRelationship;
  selectedNodeCount: number;
  onUpdateNode: (node: GraphNode) => void;
  onUpdateRelationship: (relationship: GraphRelationship) => void;
};

const contentTypes: NodeContentType[] = ["article", "example", "dataset", "note"];

function parseProperties(value: string): Record<string, string | number | boolean> {
  if (!value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value) as Record<string, string | number | boolean>;
  return parsed;
}

function parseSourceData(value: string): unknown {
  if (!value.trim()) {
    return undefined;
  }

  return JSON.parse(value);
}

export default function InspectorPanel({
  selectedNode,
  selectedRelationship,
  selectedNodeCount,
  onUpdateNode,
  onUpdateRelationship,
}: InspectorPanelProps) {
  if (selectedNode) {
    const sourceDataValue =
      selectedNode.content.sourceData === undefined
        ? ""
        : JSON.stringify(selectedNode.content.sourceData, null, 2);

    return (
      <aside className="inspector-panel">
        <h2>Node</h2>
        <label>
          Title
          <input
            value={selectedNode.title}
            onChange={(event) => onUpdateNode({ ...selectedNode, title: event.target.value })}
          />
        </label>
        <label>
          Content type
          <select
            value={selectedNode.content.type}
            onChange={(event) =>
              onUpdateNode(
                updateNodeContent(selectedNode, { type: event.target.value as NodeContentType }),
              )
            }
          >
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Labels
          <input
            value={stringifyListInput(selectedNode.labels)}
            onChange={(event) =>
              onUpdateNode({ ...selectedNode, labels: parseListInput(event.target.value) })
            }
          />
        </label>
        <label>
          Tags
          <input
            value={stringifyListInput(selectedNode.tags)}
            onChange={(event) =>
              onUpdateNode({ ...selectedNode, tags: parseListInput(event.target.value) })
            }
          />
        </label>
        <details open>
          <summary>Wiki article</summary>
          <MarkdownEditor
            markdown={selectedNode.content.markdown}
            onChange={(markdown) => onUpdateNode(updateNodeContent(selectedNode, { markdown }))}
          />
        </details>
        <details>
          <summary>Structured JSON data</summary>
          <textarea
            className="json-textarea"
            defaultValue={sourceDataValue}
            onBlur={(event) => {
              try {
                onUpdateNode(updateNodeContent(selectedNode, { sourceData: parseSourceData(event.target.value) }));
              } catch {
                event.currentTarget.classList.add("invalid");
              }
            }}
            onFocus={(event) => event.currentTarget.classList.remove("invalid")}
          />
        </details>
        <details>
          <summary>Attached files</summary>
          <label className="file-button inline">
            Add metadata
            <input
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                // TODO: Store file bytes with IndexedDB, the browser File API, or Tauri file storage.
                onUpdateNode({
                  ...selectedNode,
                  attachments: [...selectedNode.attachments, createAttachmentFromFile(file)],
                });
                event.target.value = "";
              }}
            />
          </label>
          {selectedNode.attachments.length === 0 ? (
            <p className="muted">No file metadata attached.</p>
          ) : (
            <ul className="attachment-list">
              {selectedNode.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <strong>{attachment.name}</strong>
                  <span>{attachment.mimeType}</span>
                  <span>{attachment.sizeBytes.toLocaleString()} bytes</span>
                </li>
              ))}
            </ul>
          )}
        </details>
      </aside>
    );
  }

  if (selectedNodeCount > 1) {
    return (
      <aside className="inspector-panel empty">
        <h2>Selection</h2>
        <p>{selectedNodeCount} nodes selected.</p>
      </aside>
    );
  }

  if (selectedRelationship) {
    return (
      <aside className="inspector-panel">
        <h2>Relationship</h2>
        <label>
          Type
          <input
            value={selectedRelationship.type}
            onChange={(event) =>
              onUpdateRelationship({ ...selectedRelationship, type: event.target.value })
            }
          />
        </label>
        <label>
          From node id
          <input value={selectedRelationship.fromNodeId} readOnly />
        </label>
        <label>
          To node id
          <input value={selectedRelationship.toNodeId} readOnly />
        </label>
        <label>
          Properties JSON
          <textarea
            className="json-textarea"
            defaultValue={JSON.stringify(selectedRelationship.properties, null, 2)}
            onBlur={(event) => {
              try {
                onUpdateRelationship({
                  ...selectedRelationship,
                  properties: parseProperties(event.target.value),
                });
              } catch {
                event.currentTarget.classList.add("invalid");
              }
            }}
            onFocus={(event) => event.currentTarget.classList.remove("invalid")}
          />
        </label>
        <label>
          Stroke
          <input
            type="color"
            value={selectedRelationship.style.stroke}
            onChange={(event) =>
              onUpdateRelationship({
                ...selectedRelationship,
                style: { ...selectedRelationship.style, stroke: event.target.value },
              })
            }
          />
        </label>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel empty">
      <h2>Inspector</h2>
      <p>Select a node or relationship to edit its details.</p>
    </aside>
  );
}
