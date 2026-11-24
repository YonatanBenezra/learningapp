"use client";

import CodeEditor from "@uiw/react-textarea-code-editor";
import "@uiw/react-textarea-code-editor/dist.css";

type GuardrailsG3CodeFieldProps = {
  value: string;
  language: "yaml" | "text";
  disabled?: boolean;
  minLines?: number;
  /** Accessible name for the editor, e.g. "Output filter". */
  label?: string;
  onChange: (next: string) => void;
};

export function GuardrailsG3CodeField({
  value,
  language,
  disabled,
  minLines = 4,
  onChange,
  label,
}: GuardrailsG3CodeFieldProps) {
  const contentLines = value.split("\n").length;
  const lineCount = Math.max(minLines, contentLines);
  const lines = Array.from({ length: lineCount }, (_, index) => index + 1);
  const minHeightPx = Math.round(lineCount * 17.4);

  return (
    <div className="lp-grd-g3-editor-row">
      <div className="lp-grd-g3-gutter" aria-hidden="true">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div className="lp-grd-g3-editor-body">
        <CodeEditor
          value={value}
          language={language === "yaml" ? "yaml" : "text"}
          data-color-mode="dark"
          disabled={disabled}
          padding={10}
          minHeight={minHeightPx}
          spellCheck={false}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          style={{
            fontSize: 12,
            lineHeight: 1.45,
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
            backgroundColor: "transparent",
          }}
        />
      </div>
    </div>
  );
}
