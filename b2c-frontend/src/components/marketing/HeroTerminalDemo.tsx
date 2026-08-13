'use client';

import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import { useMarketingTerminalDemo } from '@/src/i18n';

export function HeroTerminalDemo() {
  const { command, output, label } = useMarketingTerminalDemo();
  const [typed, setTyped] = useState('');
  const [lines, setLines] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    setTyped('');
    setLines(0);
    setCursor(true);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setTyped(command);
      setLines(output.length);
      setCursor(false);
      return;
    }

    let i = 0;
    let lineTimer: ReturnType<typeof setTimeout> | undefined;
    const typeTimer = setInterval(() => {
      i += 1;
      setTyped(command.slice(0, i));
      if (i >= command.length) {
        clearInterval(typeTimer);
        let n = 0;
        lineTimer = setInterval(() => {
          n += 1;
          setLines(n);
          if (n >= output.length) {
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
  }, [command, output]);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 text-[13px] leading-relaxed">
      <div className="mb-3 flex items-center gap-2 text-slate-400">
        <Terminal className="size-4" />
        <span className="font-medium">{label}</span>
      </div>
      <p className="font-mono text-[12px]" style={{ color: 'var(--aivora-primary)' }}>
        $ {typed}
        {cursor ? (
          <span
            className="ml-0.5 inline-block w-2 animate-pulse"
            style={{ backgroundColor: 'color-mix(in srgb, var(--aivora-primary) 80%, transparent)' }}
          >
            &nbsp;
          </span>
        ) : null}
      </p>
      {output.slice(0, lines).map((line) => (
        <p key={line} className="font-mono text-[12px] text-slate-300">
          {line}
        </p>
      ))}
    </div>
  );
}
