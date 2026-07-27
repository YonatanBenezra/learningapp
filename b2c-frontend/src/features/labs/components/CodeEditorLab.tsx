'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import {
  ChevronDown,
  Circle,
  Loader2,
  Play,
  TerminalSquare,
} from 'lucide-react';
import { MonacoCodeEditor } from '@/src/components/ui/MonacoCodeEditor';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { executeCode, type CodeLanguage, type SandboxResult } from '../labsApi';

export interface CodeEditorSubmission {
  language: CodeLanguage;
  code: string;
  lastRun?: SandboxResult | null;
}

const LANGUAGES: { id: CodeLanguage; label: string; monaco: string }[] = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'shell', label: 'Shell', monaco: 'shell' },
];

function parseStarter(starterState: unknown): { language: CodeLanguage; code: string } {
  if (starterState && typeof starterState === 'object') {
    const s = starterState as Record<string, unknown>;
    const langRaw = typeof s.language === 'string' ? s.language.toLowerCase() : 'javascript';
    const language =
      langRaw === 'python' || langRaw === 'shell' || langRaw === 'javascript'
        ? langRaw
        : 'javascript';
    const code = typeof s.code === 'string' ? s.code : '';
    return { language, code };
  }
  if (typeof starterState === 'string') {
    return { language: 'javascript', code: starterState };
  }
  return { language: 'javascript', code: '// Write your solution here\n' };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function CodeEditorLab({
  starterState,
  value,
  onChange,
  readOnly = false,
}: {
  starterState: unknown;
  value: CodeEditorSubmission | null;
  onChange: (data: CodeEditorSubmission) => void;
  readOnly?: boolean;
}) {
  const initial = parseStarter(starterState);
  const [language, setLanguage] = useState<CodeLanguage>(value?.language ?? initial.language);
  const [code, setCode] = useState(value?.code ?? initial.code);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<SandboxResult | null>(value?.lastRun ?? null);
  const [outputOpen, setOutputOpen] = useState(true);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const runCodeRef = useRef<() => void>(() => {});

  const monacoLanguage = LANGUAGES.find((item) => item.id === language)?.monaco ?? 'javascript';

  useEffect(() => {
    onChange({ language, code, lastRun });
  }, [language, code, lastRun, onChange]);

  const runCode = useCallback(async () => {
    setRunning(true);
    setRunError(null);
    setOutputOpen(true);
    try {
      const result = await executeCode({ language, code });
      setLastRun(result);
    } catch {
      setRunError('Could not run code. Check your sandbox limits or try again.');
    } finally {
      setRunning(false);
    }
  }, [language, code]);

  useEffect(() => {
    runCodeRef.current = () => {
      void runCode();
    };
  }, [runCode]);

  const handleEditorMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    editorInstance.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [2048 | 3], // Ctrl/Cmd + Enter
      run: () => runCodeRef.current(),
    });
    editorInstance.focus();
  }, []);

  const lineCount = code.split('\n').length;
  const outputText = lastRun ? lastRun.stdout || lastRun.stderr || '(no output)' : '';
  const hasOutput = Boolean(runError || lastRun);

  return (
    <div className="overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d2d] bg-[#252526] px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] p-1">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={readOnly}
                onClick={() => setLanguage(item.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  language === item.id
                    ? 'bg-[#007F8E] text-white shadow-sm'
                    : 'text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white',
                  readOnly && language !== item.id && 'opacity-50',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="hidden text-[11px] text-[#858585] sm:inline">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {!readOnly ? (
          <Button
            size="sm"
            onClick={() => void runCode()}
            disabled={running}
            className="h-8 border border-[#007F8E]/40 bg-[#007F8E] px-3 text-xs font-semibold text-white hover:bg-[#006B78]"
          >
            {running ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            Run code
            <span className="hidden text-[10px] font-normal opacity-70 sm:inline">Ctrl+Enter</span>
          </Button>
        ) : (
          <span className="text-xs text-[#858585]">Read-only mode</span>
        )}
      </div>

      <div className="border-b border-[#2d2d2d]">
        <MonacoCodeEditor
          value={code}
          language={monacoLanguage}
          readOnly={readOnly}
          height="min(520px, 55vh)"
          onChange={setCode}
          onMount={handleEditorMount}
        />
      </div>

      <div className="border-t border-[#2d2d2d] bg-[#1e1e1e]">
        <button
          type="button"
          onClick={() => setOutputOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-[#252526]"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#cccccc]">
            <TerminalSquare className="size-3.5 text-[#007F8E]" />
            Output
          </span>
          <span className="flex items-center gap-3 text-[11px] text-[#858585]">
            {lastRun ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Circle
                    className={cn(
                      'size-2 fill-current',
                      lastRun.exitCode === 0 ? 'text-[#4ec9b0]' : 'text-[#f48771]',
                    )}
                  />
                  exit {lastRun.exitCode ?? '—'}
                </span>
                <span>{formatDuration(lastRun.durationMs)}</span>
                {lastRun.timedOut ? <span>timed out</span> : null}
                {lastRun.oom ? <span>oom</span> : null}
              </>
            ) : null}
            <ChevronDown
              className={cn('size-4 transition-transform', outputOpen && 'rotate-180')}
            />
          </span>
        </button>

        {outputOpen ? (
          <div className="border-t border-[#2d2d2d] bg-[#0d1117] px-4 py-3">
            {runError ? (
              <p className="font-mono text-sm text-[#f48771]">{runError}</p>
            ) : hasOutput ? (
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-[#e6edf3]">
                {outputText}
              </pre>
            ) : (
              <p className="font-mono text-sm text-[#6e7681]">
                Run your code to see stdout and stderr here.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CodeEditorLab;
