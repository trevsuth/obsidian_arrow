type ToolbarProps = {
  documentTitle: string;
  pendingRelationship: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onTitleChange: (title: string) => void;
  onAddNode: () => void;
  onStartRelationship: () => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
};

export default function Toolbar({
  documentTitle,
  pendingRelationship,
  canUndo,
  canRedo,
  onTitleChange,
  onAddNode,
  onStartRelationship,
  onDeleteSelected,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onReset,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <input
        className="document-title"
        value={documentTitle}
        onChange={(event) => onTitleChange(event.target.value)}
      />
      <button type="button" onClick={onAddNode}>
        Add node
      </button>
      <button type="button" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" onClick={onRedo} disabled={!canRedo}>
        Redo
      </button>
      <button type="button" className={pendingRelationship ? "active" : ""} onClick={onStartRelationship}>
        Relationship
      </button>
      <button type="button" onClick={onDeleteSelected}>
        Delete selected
      </button>
      <button type="button" onClick={onExport}>
        Export JSON
      </button>
      <label className="file-button">
        Import JSON
        <input
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImport(file);
              event.target.value = "";
            }
          }}
        />
      </label>
      <button type="button" onClick={onReset}>
        New document
      </button>
    </header>
  );
}
