/** Small, text-only renderer: no HTML injection or model-supplied links. */
export function AssistantNarrative({ text }: { text: string }) {
  const inline = (line: string) =>
    line
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      );
  return (
    <div className="ask-narrative">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          const lines = block.split("\n");
          return lines.every((line) => /^[-*]\s+/.test(line)) ? (
            <ul key={i}>
              {lines.map((line, j) => (
                <li key={j}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{inline(block)}</p>
          );
        })}
    </div>
  );
}
