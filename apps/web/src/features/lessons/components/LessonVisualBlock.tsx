'use client';

import { motion } from 'framer-motion';
import type { LessonVisual, LessonVisualType } from '@/src/features/lessons/lessonsApi';
import { cn } from '@/src/lib/utils';

function splitElement(element: string): { title: string; body?: string } {
  const index = element.indexOf(':');
  if (index > 0 && index < 56) {
    const title = element.slice(0, index).trim();
    const body = element.slice(index + 1).trim();
    if (title && body) return { title, body };
  }
  return { title: element };
}

const typeLabel: Record<LessonVisualType, string> = {
  diagram: 'Diagram',
  timeline: 'Timeline',
  comparison: 'Comparison',
  flowchart: 'Flow',
  infographic: 'Insight',
};

export function LessonVisualBlock({ visual }: { visual: LessonVisual }) {
  const items = (visual.elements ?? []).map(splitElement);
  const label = typeLabel[visual.type] ?? typeLabel.diagram;

  return (
    <div>
      <p className="text-xs font-medium text-ink/40">{label}</p>
      <h3 className="mt-1 font-heading text-lg font-medium tracking-[-0.02em] text-ink">
        {visual.title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-ink/65">{visual.description}</p>

      {items.length > 0 ? (
        <div className="mt-5">
          {visual.type === 'timeline' || visual.type === 'flowchart' ? (
            <StepList items={items} />
          ) : visual.type === 'comparison' ? (
            <ComparisonGrid items={items} />
          ) : (
            <PillarGrid items={items} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function PillarGrid({ items }: { items: { title: string; body?: string }[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <motion.li
          key={`${item.title}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="rounded-md border border-line/70 bg-bg-elev/50 p-4"
        >
          <span className="font-heading text-sm font-medium tabular-nums text-primary/80">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="mt-2 text-sm font-medium text-ink">{item.title}</p>
          {item.body ? <p className="mt-1.5 text-sm leading-6 text-ink/60">{item.body}</p> : null}
        </motion.li>
      ))}
    </ul>
  );
}

function ComparisonGrid({ items }: { items: { title: string; body?: string }[] }) {
  return (
    <ul className={cn('grid gap-3', items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
      {items.map((item, index) => (
        <motion.li
          key={`${item.title}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="rounded-md border border-line/70 bg-bg-elev/50 p-4"
        >
          <p className="text-sm font-medium text-ink">{item.title}</p>
          {item.body ? <p className="mt-2 text-sm leading-6 text-ink/60">{item.body}</p> : null}
        </motion.li>
      ))}
    </ul>
  );
}

function StepList({ items }: { items: { title: string; body?: string }[] }) {
  return (
    <ol className="relative ms-3 space-y-0 border-s border-line/70">
      {items.map((item, index) => (
        <motion.li
          key={`${item.title}-${index}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.06, duration: 0.28 }}
          className="relative py-3 ps-6"
        >
          <span className="absolute start-0 top-4 size-2.5 -translate-x-1/2 rounded-full bg-primary rtl:translate-x-1/2" />
          <p className="text-sm font-medium text-ink">{item.title}</p>
          {item.body ? <p className="mt-1 text-sm leading-6 text-ink/60">{item.body}</p> : null}
        </motion.li>
      ))}
    </ol>
  );
}
