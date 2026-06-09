type MarkdownEditorProps = {
  markdown: string;
  onChange: (markdown: string) => void;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown).split("\n");
  const html = lines
    .map((line) => {
      if (line.startsWith("### ")) {
        return `<h3>${line.slice(4)}</h3>`;
      }
      if (line.startsWith("## ")) {
        return `<h2>${line.slice(3)}</h2>`;
      }
      if (line.startsWith("# ")) {
        return `<h1>${line.slice(2)}</h1>`;
      }
      if (line.startsWith("- ")) {
        return `<li>${line.slice(2)}</li>`;
      }
      if (!line.trim()) {
        return "";
      }
      const withStrong = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      const withEmphasis = withStrong.replace(/\*(.*?)\*/g, "<em>$1</em>");
      return `<p>${withEmphasis}</p>`;
    })
    .join("");

  return html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");
}

export default function MarkdownEditor({ markdown, onChange }: MarkdownEditorProps) {
  return (
    <div className="markdown-editor">
      <textarea
        value={markdown}
        onChange={(event) => onChange(event.target.value)}
        spellCheck
      />
      <article
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
      />
    </div>
  );
}
