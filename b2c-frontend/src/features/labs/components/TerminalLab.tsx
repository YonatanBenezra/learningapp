'use client';

import { useEffect, useState } from 'react';
import { Loader2, Terminal } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from '@/src/i18n';
import { runTerminalCommand } from '../labsApi';

export interface TerminalHistoryEntry {
  command: string;
  output: string;
  error: boolean;
}

export interface TerminalSubmission {
  cwd: string;
  history: TerminalHistoryEntry[];
}

function parseStarter(starterState: unknown): { cwd: string } {
  if (starterState && typeof starterState === 'object') {
    const s = starterState as Record<string, unknown>;
    return { cwd: typeof s.cwd === 'string' ? s.cwd : '/home/analyst' };
  }
  return { cwd: '/home/analyst' };
}

export function TerminalLab({
  starterState,
  value,
  onChange,
  readOnly = false,
}: {
  starterState: unknown;
  value: TerminalSubmission | null;
  onChange: (data: TerminalSubmission) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const initial = parseStarter(starterState);
  const [cwd, setCwd] = useState(value?.cwd ?? initial.cwd);
  const [history, setHistory] = useState<TerminalHistoryEntry[]>(value?.history ?? []);
  const [command, setCommand] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    onChange({ cwd, history });
  }, [cwd, history, onChange]);

  async function sendCommand() {
    const trimmed = command.trim();
    if (!trimmed || readOnly) return;
    setRunning(true);
    try {
      const result = await runTerminalCommand({ command: trimmed, cwd });
      setCwd(result.cwd);
      setHistory((prev) => [
        ...prev,
        { command: trimmed, output: result.output, error: result.error },
      ]);
      setCommand('');
    } catch {
      setHistory((prev) => [
        ...prev,
        { command: trimmed, output: t('labs.commandFailed'), error: true },
      ]);
      setCommand('');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0F172A]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs text-[#94A3B8]">
        <Terminal className="size-4" />
        {t('labs.terminalSimulator', { cwd })}
      </div>
      <div className="max-h-72 overflow-y-auto p-4 font-mono text-sm leading-6 text-[#E2E8F0]">
        {history.length === 0 && (
          <p className="text-[#94A3B8]">{t('labs.terminalHint')}</p>
        )}
        {history.map((entry, i) => (
          <div key={`${entry.command}-${i}`} className="mb-3">
            <div className="text-[#7DD3FC]">$ {entry.command}</div>
            <pre className={`whitespace-pre-wrap ${entry.error ? 'text-[#FCA5A5]' : ''}`}>
              {entry.output}
            </pre>
          </div>
        ))}
      </div>
      {!readOnly && (
        <div className="flex gap-2 border-t border-white/10 p-3">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void sendCommand();
              }
            }}
            placeholder={t('labs.enterCommand')}
            className="flex-1 rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2 font-mono text-sm text-white outline-none focus:border-primary"
          />
          <Button size="sm" onClick={() => void sendCommand()} disabled={running || !command.trim()}>
            {running ? <Loader2 className="size-4 animate-spin" /> : t('labs.run')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default TerminalLab;
