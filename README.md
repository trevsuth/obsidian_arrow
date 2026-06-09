Local Graph Wiki
================

A local-first visual graph and wiki application inspired by arrows.app. The first version runs entirely in the browser with React, TypeScript, Vite, an SVG graph canvas, and `localStorage` persistence.

Run it
------

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

Build it
--------

```bash
npm run build
```

Architecture
------------

- `src/types/graph.ts` defines the stable graph document, node, relationship, and attachment model.
- `src/lib/graphOps.ts` contains pure graph operations for creating, updating, moving, connecting, and deleting graph entities.
- `src/lib/storage.ts` owns local save/load plus JSON import/export helpers.
- `src/lib/search.ts` searches node titles, labels, tags, and markdown content.
- `src/components/GraphCanvas.tsx` renders the SVG graph and handles drag/select interactions.
- `src/components/InspectorPanel.tsx` edits selected node or relationship metadata.
- `src/components/MarkdownEditor.tsx` provides a lightweight markdown editor and preview.

Next steps
----------

- Add undo/redo by storing command history or immutable document snapshots.
- Add richer relationship creation affordances, pan/zoom, and canvas fit controls.
- Replace the simple markdown renderer with a parser such as `remark` once dependencies are acceptable.
- Move file bytes into IndexedDB for browser-only use, then map the same metadata model to Tauri file storage later.
- Add a repository layer that can swap `localStorage` for SQLite without changing UI components.
