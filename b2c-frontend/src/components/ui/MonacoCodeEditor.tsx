'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { useMemo } from 'react';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="size-6 animate-spin text-[#007F8E]" />
    </div>
  ),
});

export interface MonacoCodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string | number;
  onMount?: (editorInstance: editor.IStandaloneCodeEditor) => void;
}

export function MonacoCodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = '420px',
  onMount,
}: MonacoCodeEditorProps) {
  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      readOnly,
      minimap: { enabled: true, scale: 1 },
      fontSize: 14,
      fontFamily: "var(--font-geist-mono), 'Cascadia Code', Consolas, 'Courier New', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'off',
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: 'all',
      bracketPairColorization: { enabled: true },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: !readOnly,
      quickSuggestions: readOnly ? false : { other: true, comments: false, strings: false },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      overviewRulerBorder: false,
      folding: true,
      glyphMargin: false,
      lineDecorationsWidth: 8,
      renderWhitespace: 'selection',
      guides: { indentation: true, bracketPairs: true },
    }),
    [readOnly],
  );

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme="vs-dark"
      options={options}
      onChange={(next) => onChange?.(next ?? '')}
      onMount={onMount}
    />
  );
}
