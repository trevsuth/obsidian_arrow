import { useEffect, useMemo, useRef, useState } from "react";
import GraphCanvas from "./components/GraphCanvas";
import InspectorPanel from "./components/InspectorPanel";
import SearchPanel from "./components/SearchPanel";
import Toolbar from "./components/Toolbar";
import {
  addNode,
  addRelationship,
  createAttachmentFromFile,
  createFragmentFromSelection,
  createEmptyDocument,
  createNode,
  createRelationship,
  deleteSelection,
  duplicateSelection,
  findOpenNodePosition,
  getSelectedNodeIds,
  layoutSelectedNodes,
  moveNode,
  moveNodes,
  pasteFragment,
  touchDocument,
  toggleNodeSelection,
  updateNode,
  updateNodesStyle,
  updateRelationship,
  type NodeStylePatch,
  type GraphFragment,
} from "./lib/graphOps";
import {
  deleteAttachmentFile,
  exportDocument,
  importDocument,
  loadAttachmentFile,
  loadDocument,
  saveAttachmentFile,
  saveDocument,
} from "./lib/storage";
import { searchNodes } from "./lib/search";
import type { AttachedFile, GraphDocument, GraphNode, GraphRelationship, Selection } from "./types/graph";

type SaveStatus = "saved" | "saving" | "error";

export default function App() {
  const [document, setDocument] = useState<GraphDocument>(() => loadDocument());
  const documentRef = useRef(document);
  const dragStartDocumentRef = useRef<GraphDocument | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [pendingRelationshipFromId, setPendingRelationshipFromId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<GraphFragment | null>(null);
  const [history, setHistory] = useState<{ past: GraphDocument[]; future: GraphDocument[] }>({
    past: [],
    future: [],
  });
  const [saveState, setSaveState] = useState<{ status: SaveStatus; savedAt?: string; error?: string }>({
    status: "saved",
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    documentRef.current = document;
    setSaveState((current) => ({ status: "saving", savedAt: current.savedAt }));
    try {
      const result = saveDocument(document);
      setSaveState({ status: "saved", savedAt: result.savedAt });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error instanceof Error ? error.message : "Could not save document.",
      });
    }
  }, [document]);

  function pushHistory(snapshot: GraphDocument) {
    setHistory((current) => ({
      past: [...current.past, snapshot].slice(-50),
      future: [],
    }));
  }

  function commitDocument(updater: (current: GraphDocument) => GraphDocument) {
    const current = documentRef.current;
    const next = updater(current);
    if (next === current) {
      return;
    }

    pushHistory(current);
    documentRef.current = next;
    setDocument(next);
  }

  function handleUndo() {
    setHistory((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) {
        return current;
      }

      const currentDocument = documentRef.current;
      documentRef.current = previous;
      setDocument(previous);
      setSelection(null);
      setPendingRelationshipFromId(null);

      return {
        past: current.past.slice(0, -1),
        future: [currentDocument, ...current.future],
      };
    });
  }

  function handleRedo() {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) {
        return current;
      }

      const currentDocument = documentRef.current;
      documentRef.current = next;
      setDocument(next);
      setSelection(null);
      setPendingRelationshipFromId(null);

      return {
        past: [...current.past, currentDocument].slice(-50),
        future: current.future.slice(1),
      };
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";

      if (isTextInput) {
        return;
      }

      const isCopy = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";
      const isPaste = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v";
      const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey;
      const isRedo =
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && event.shiftKey) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y");
      const isDelete = event.key === "Delete" || event.key === "Backspace";

      if (isUndo) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (isRedo) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (isCopy) {
        const fragment = createFragmentFromSelection(document, selection);
        if (fragment) {
          event.preventDefault();
          setClipboard(fragment);
        }
        return;
      }

      if (isPaste && clipboard) {
        event.preventDefault();
        let nextSelection: Selection = null;
        commitDocument((current) => {
          const result = pasteFragment(current, clipboard);
          nextSelection = result.selection;
          return result.document;
        });
        setSelection(nextSelection);
        setPendingRelationshipFromId(null);
        return;
      }

      if (isDelete) {
        event.preventDefault();
        commitDocument((current) => deleteSelection(current, selection));
        setSelection(null);
        setPendingRelationshipFromId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clipboard, document, history, selection]);

  const selectedNode =
    selection?.kind === "node" ? document.nodes.find((node) => node.id === selection.id) : undefined;
  const selectedRelationship =
    selection?.kind === "relationship"
      ? document.relationships.find((relationship) => relationship.id === selection.id)
      : undefined;
  const searchResults = useMemo(() => searchNodes(document, query), [document, query]);
  const selectedNodeIds = useMemo(() => getSelectedNodeIds(selection), [selection]);

  function handleAddNode() {
    const position = findOpenNodePosition(document, 250 + document.nodes.length * 36, 220 + document.nodes.length * 28);
    const node = createNode({
      title: `Node ${document.nodes.length + 1}`,
      x: position.x,
      y: position.y,
    });
    commitDocument((current) => addNode(current, node));
    setSelection({ kind: "node", id: node.id });
  }

  function handleStartRelationship() {
    const firstSelectedNodeId = selectedNodeIds[0];
    if (firstSelectedNodeId) {
      setPendingRelationshipFromId(firstSelectedNodeId);
      return;
    }

    setPendingRelationshipFromId(null);
  }

  function handleCreateRelationship(fromNodeId: string, toNodeId: string) {
    if (fromNodeId === toNodeId) {
      setPendingRelationshipFromId(null);
      return;
    }

    const existingRelationship = document.relationships.find(
      (relationship) =>
        relationship.fromNodeId === fromNodeId &&
        relationship.toNodeId === toNodeId &&
        relationship.type === "relates_to",
    );

    if (existingRelationship) {
      setSelection({ kind: "relationship", id: existingRelationship.id });
      setPendingRelationshipFromId(null);
      return;
    }

    const relationship = createRelationship(fromNodeId, toNodeId);
    commitDocument((current) => addRelationship(current, relationship));
    setSelection({ kind: "relationship", id: relationship.id });
    setPendingRelationshipFromId(null);
  }

  function handleCreateLinkedNode(fromNodeId: string, x: number, y: number) {
    const position = findOpenNodePosition(document, x, y);
    const node = createNode({
      title: `Node ${document.nodes.length + 1}`,
      x: position.x,
      y: position.y,
    });
    const relationship = createRelationship(fromNodeId, node.id);

    commitDocument((current) => addRelationship(addNode(current, node), relationship));
    setSelection({ kind: "node", id: node.id });
    setPendingRelationshipFromId(null);
  }

  function handleNodeRelationshipClick(nodeId: string) {
    if (!pendingRelationshipFromId) {
      return;
    }

    handleCreateRelationship(pendingRelationshipFromId, nodeId);
  }

  function handleDeleteSelected() {
    commitDocument((current) => deleteSelection(current, selection));
    setSelection(null);
    setPendingRelationshipFromId(null);
  }

  function handleDuplicateSelected() {
    let nextSelection: Selection = null;
    commitDocument((current) => {
      const result = duplicateSelection(current, selection);
      nextSelection = result.selection;
      return result.document;
    });
    setSelection(nextSelection);
    setPendingRelationshipFromId(null);
  }

  function handleLayoutSelected(mode: "grid" | "circle") {
    commitDocument((current) => layoutSelectedNodes(current, selectedNodeIds, mode));
  }

  function handleUpdateSelectedNodeStyle(patch: NodeStylePatch) {
    commitDocument((current) => updateNodesStyle(current, selectedNodeIds, patch));
  }

  function handleExport() {
    const blob = new Blob([exportDocument(document)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.title.replace(/\W+/g, "-").toLowerCase() || "graph-wiki"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    try {
      const raw = await file.text();
      const imported = importDocument(raw);
      commitDocument(() => touchDocument(imported));
      setSelection(null);
      setPendingRelationshipFromId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not import graph JSON.");
    }
  }

  function handleUpdateNode(node: GraphNode) {
    commitDocument((current) => updateNode(current, node.id, () => node));
  }

  function handleUpdateRelationship(relationship: GraphRelationship) {
    commitDocument((current) => updateRelationship(current, relationship.id, () => relationship));
  }

  async function handleAddAttachment(nodeId: string, file: File) {
    const attachment = createAttachmentFromFile(file);

    try {
      await saveAttachmentFile(file, attachment);
      commitDocument((current) =>
        updateNode(current, nodeId, (node) => ({
          ...node,
          attachments: [...node.attachments, attachment],
        })),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not save attachment file.");
    }
  }

  async function handleDownloadAttachment(attachment: AttachedFile) {
    try {
      const blob = await loadAttachmentFile(attachment);
      if (!blob) {
        window.alert("Attachment bytes are not available for this document.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not download attachment.");
    }
  }

  async function handleDeleteAttachment(nodeId: string, attachment: AttachedFile) {
    try {
      await deleteAttachmentFile(attachment);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete attachment bytes.");
      return;
    }

    commitDocument((current) =>
      updateNode(current, nodeId, (node) => ({
        ...node,
        attachments: node.attachments.filter((item) => item.id !== attachment.id),
      })),
    );
  }

  return (
    <main className="app-shell">
      <Toolbar
        documentTitle={document.title}
        saveStatus={saveState.status}
        lastSavedAt={saveState.savedAt}
        saveError={saveState.error}
        pendingRelationship={Boolean(pendingRelationshipFromId)}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onTitleChange={(title) => commitDocument((current) => touchDocument({ ...current, title }))}
        onAddNode={handleAddNode}
        onStartRelationship={handleStartRelationship}
        onDeleteSelected={handleDeleteSelected}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        onImport={handleImport}
        onReset={() => {
          commitDocument(() => createEmptyDocument());
          setSelection(null);
          setPendingRelationshipFromId(null);
          setClipboard(null);
        }}
      />
      <div className="workspace">
        <section className="canvas-column">
          <SearchPanel
            query={query}
            results={searchResults}
            onQueryChange={setQuery}
            onSelectNode={(nodeId) => setSelection({ kind: "node", id: nodeId })}
          />
          {pendingRelationshipFromId && (
            <div className="mode-banner">Select another node to complete the relationship.</div>
          )}
          <GraphCanvas
            document={document}
            selection={selection}
            selectedNodeIds={selectedNodeIds}
            pendingRelationshipFromId={pendingRelationshipFromId}
            onSelect={setSelection}
            onToggleNodeSelection={(nodeId) =>
              setSelection((current) => toggleNodeSelection(current, nodeId))
            }
            onMoveNode={(nodeId, x, y) =>
              setDocument((current) => {
                const next = moveNode(current, nodeId, x, y);
                documentRef.current = next;
                return next;
              })
            }
            onMoveNodes={(positions) =>
              setDocument((current) => {
                const next = moveNodes(current, positions);
                documentRef.current = next;
                return next;
              })
            }
            onNodeRelationshipClick={handleNodeRelationshipClick}
            onCreateLinkedNode={handleCreateLinkedNode}
            onCreateRelationship={handleCreateRelationship}
            onBeginNodeDrag={() => {
              dragStartDocumentRef.current = documentRef.current;
            }}
            onEndNodeDrag={() => {
              const snapshot = dragStartDocumentRef.current;
              dragStartDocumentRef.current = null;
              if (snapshot && snapshot !== documentRef.current) {
                pushHistory(snapshot);
              }
            }}
          />
        </section>
        <InspectorPanel
          selectedNode={selectedNode}
          selectedRelationship={selectedRelationship}
          document={document}
          nodes={document.nodes}
          selectedNodeCount={selectedNodeIds.length}
          onUpdateNode={handleUpdateNode}
          onUpdateRelationship={handleUpdateRelationship}
          onAddAttachment={handleAddAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDuplicateSelection={handleDuplicateSelected}
          onLayoutSelection={handleLayoutSelected}
          onUpdateSelectedNodeStyle={handleUpdateSelectedNodeStyle}
          onSelectNode={(nodeId) => setSelection({ kind: "node", id: nodeId })}
        />
      </div>
    </main>
  );
}
