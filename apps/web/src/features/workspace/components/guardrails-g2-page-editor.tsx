"use client";

import { useMemo } from "react";
type GuardrailsG2PageEditorProps = {
  filename: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightComments(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<mark class="lp-grd-g2-comment">$1</mark>',
  );
}

export function GuardrailsG2PageEditor({
  filename,
  value,
  disabled,
  onChange,
}: GuardrailsG2PageEditorProps) {
  const mirrorHtml = useMemo(() => highlightComments(value), [value]);

  return (
    <div className="lp-grd-g2-editor-stack">
      <div className="lp-grd-g2-file-bar">
        <span className="lp-grd-g2-file-name">{filename}</span>
      </div>
      <div className="lp-grd-g2-editor-wrap">
        <pre
          className="lp-grd-g2-editor-mirror"
          aria-hidden
          dangerouslySetInnerHTML={{
            __html: `${mirrorHtml || " "}<br />`,
          }}
        />
        <textarea
          className="lp-grd-g2-editor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
