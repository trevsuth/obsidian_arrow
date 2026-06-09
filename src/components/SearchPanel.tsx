import type { SearchResult } from "../lib/search";

type SearchPanelProps = {
  query: string;
  results: SearchResult[];
  onQueryChange: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
};

export default function SearchPanel({
  query,
  results,
  onQueryChange,
  onSelectNode,
}: SearchPanelProps) {
  return (
    <section className="search-panel">
      <input
        type="search"
        value={query}
        placeholder="Search graph wiki"
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {query && (
        <div className="search-results">
          {results.length === 0 ? (
            <p>No matching nodes.</p>
          ) : (
            results.map((result) => (
              <button key={result.node.id} type="button" onClick={() => onSelectNode(result.node.id)}>
                <strong>{result.node.title}</strong>
                <span>{result.matchedFields.join(", ")}</span>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
