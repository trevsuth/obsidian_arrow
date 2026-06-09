# Recommended Next Steps

## Interaction polish

- [x] Add box/lasso selection for selecting node groups without modifier-clicking each node.
- [x] Add canvas pan and zoom controls, including fit-to-graph.
- [x] Add snap-to-grid and optional alignment guides while dragging nodes.
- [x] Add visible relationship handles on multiple sides of a node, not just the right edge.
- [x] Add undo/redo using document snapshots or command objects.

## Graph editing

- Support editing relationship direction and swapping source/target nodes.
- Add relationship type presets and color/style mappings.
- Add grouped operations for multi-selected nodes, such as move, delete, duplicate, and style updates.
- Add automatic layout options for selected subgraphs.
- Add collision-aware placement when dragging out new linked nodes.

## Wiki content

- Replace the simple markdown preview with a proper parser such as `remark` or `markdown-it`.
- Add backlinks and outbound links for node references.
- Add a node activity/history panel with updated timestamps.
- Add templates for articles, examples, datasets, and notes.
- Add validation and formatting for structured JSON data.

## Search and navigation

- Add keyboard shortcuts for search, add node, duplicate, and relationship mode.
- Add search result highlighting in the graph.
- Add filtering by labels, tags, and content type.
- Add a minimap or outline view for large graphs.
- Add breadcrumb-style navigation for recently visited nodes.

## Persistence

- Introduce a storage repository interface so `localStorage` can be swapped later.
- Add autosave status and last-saved indicators.
- Add import validation with user-friendly errors.
- Add versioned document migrations for future schema changes.
- Add IndexedDB storage for file bytes while keeping current attachment metadata.

## Tauri and SQLite preparation

- Keep graph operations pure and UI-agnostic.
- Create a persistence adapter boundary for browser, Tauri, and future server storage.
- Design SQLite tables for documents, nodes, relationships, attachments, tags, and labels.
- Add filesystem attachment handling for Tauri.
- Add export/import compatibility between browser JSON and SQLite-backed documents.

## Testing

- Add unit tests for `graphOps`, `search`, import/export, and migrations.
- Add interaction tests for node dragging, linked-node creation, copy/paste, and deletion.
- Add regression tests for multi-selection and relationship duplication.
- Add basic accessibility checks for toolbar and inspector controls.
