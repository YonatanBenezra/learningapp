'use client';

import { useEffect, useState } from 'react';
import { useMarketingTerminalDemo } from '@/src/i18n';

export function HeroTerminalDemo() {
  const { command, output } = useMarketingTerminalDemo();
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
        }, 380);
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
    <div className="min-h-[148px] overflow-hidden rounded-2xl bg-primary-deep px-4 py-4 sm:min-h-[168px] sm:px-5 sm:py-5">
      <p className="font-mono text-[13px] text-primary-2">
        $ {typed}
        {cursor ? (
          <span className="ms-0.5 inline-block w-1.5 animate-pulse bg-primary-2">&nbsp;</span>
        ) : null}
      </p>
      {output.slice(0, lines).map((line) => (
        <p key={line} className="mt-2 font-mono text-[13px] text-primary-ink/85">
          {line}
        </p>
      ))}
    </div>
  );
}
