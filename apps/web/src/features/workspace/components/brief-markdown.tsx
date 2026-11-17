/** Minimal renderer for catalogue briefMd: headings, quotes, lists, **bold**, `code`. */
export function BriefMarkdown({ text, compact = false }: { text: string; compact?: boolean }) {
  if (!text.trim()) {
    return null;
  }
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className={compact ? "lp-ws-brief lp-ws-brief--compact" : "lp-ws-brief"}>
      {blocks.map((block, index) => {
        const heading = block.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const level = heading[1]?.length ?? 2;
          const content = heading[2] ?? "";
          if (level <= 2) {
            return <h3 key={index}>{inline(content)}</h3>;
          }
          return <h4 key={index}>{inline(content)}</h4>;
        }
        if (block.startsWith(">")) {
          return (
            <blockquote key={index} className="lp-ws-quote">
              {inline(block.replace(/^>\s?/gm, ""))}
            </blockquote>
          );
        }
        if (/^[-*]\s/m.test(block)) {
          const items = block.split(/\n/).filter((line) => /^[-*]\s/.test(line));
          return (
            <ul key={index} className="lp-ws-steps">
              {items.map((line, itemIndex) => (
                <li key={itemIndex}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="lp-ws-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
