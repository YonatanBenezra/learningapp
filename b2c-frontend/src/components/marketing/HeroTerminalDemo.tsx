'use client';

import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';

const COMMAND = 'analyze --flow syn-flood';
const OUTPUT = [
  'Detected 12 suspicious SYN packets',
  'Recommended action: rate-limit source',
] as const;

export function HeroTerminalDemo() {
  const [typed, setTyped] = useState('');
  const [lines, setLines] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setTyped(COMMAND);
      setLines(OUTPUT.length);
      setCursor(false);
      return;
    }

    let i = 0;
    let lineTimer: ReturnType<typeof setTimeout> | undefined;
    const typeTimer = setInterval(() => {
      i += 1;
      setTyped(COMMAND.slice(0, i));
      if (i >= COMMAND.length) {
        clearInterval(typeTimer);
        let n = 0;
        lineTimer = setInterval(() => {
          n += 1;
          setLines(n);
          if (n >= OUTPUT.length) {
            clearInterval(lineTimer);
            setCursor(false);
          }
        }, 450);
      }
    }, 45);

    const blink = setInterval(() => setCursor((v) => !v), 530);

    return () => {
      clearInterval(typeTimer);
      clearInterval(blink);
      if (lineTimer) clearInterval(lineTimer);
    };
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 text-[13px] leading-relaxed">
      <div className="mb-3 flex items-center gap-2 text-slate-400">
        <Terminal className="size-4" />
        <span className="font-medium">Network lab — live capture</span>
      </div>
      <p className="font-mono text-[12px] text-emerald-400">
        $ {typed}
        {cursor ? <span className="ml-0.5 inline-block w-2 animate-pulse bg-emerald-400/80">&nbsp;</span> : null}
      </p>
      {OUTPUT.slice(0, lines).map((line) => (
        <p key={line} className="font-mono text-[12px] text-slate-300">
          {line}
        </p>
      ))}
    </div>
  );
}
