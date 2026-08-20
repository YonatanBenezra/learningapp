'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  ChevronsDown,
  ChevronsUp,
  Code2,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ProblemPublic } from '@/src/features/practice/practiceApi';

export type ProblemTypeFilter = 'all' | 'mcq' | 'code' | 'ai_eng';

const TYPE_PILLS: {
  id: ProblemTypeFilter;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    id: 'all',
    label: 'All Topics',
    icon: Briefcase,
    iconBg: 'bg-[#f4f4f5]',
    iconColor: 'text-ink',
  },
  {
    id: 'mcq',
    label: 'Concept',
    icon: BookOpen,
    iconBg: 'bg-[#fff4e5]',
    iconColor: 'text-[#ea580c]',
  },
  {
    id: 'code',
    label: 'Coding',
    icon: Code2,
    iconBg: 'bg-[#ecfdf5]',
    iconColor: 'text-[#059669]',
  },
  {
    id: 'ai_eng',
    label: 'AI Eng',
    icon: Sparkles,
    iconBg: 'bg-[#eff6ff]',
    iconColor: 'text-[#2563eb]',
  },
];

const COLLAPSED_TOPIC_COUNT = 8;

function topicCounts(problems: ProblemPublic[]): { topic: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of problems) {
    map.set(p.topic, (map.get(p.topic) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

export function ProblemCategoryFilters({
  problems,
  topicFilter,
  typeFilter,
  onTopicChange,
  onTypeChange,
}: {
  problems: ProblemPublic[];
  topicFilter: string | null;
  typeFilter: ProblemTypeFilter;
  onTopicChange: (topic: string | null) => void;
  onTypeChange: (type: ProblemTypeFilter) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const topics = useMemo(() => topicCounts(problems), [problems]);
  const visibleTopics = expanded ? topics : topics.slice(0, COLLAPSED_TOPIC_COUNT);
  const hasMore = topics.length > COLLAPSED_TOPIC_COUNT;

  return (
    <div className="mb-5 space-y-4 border-b border-[#e5e5e5] pb-5 dark:border-line-2">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {visibleTopics.map(({ topic, count }) => {
          const active = topicFilter === topic;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicChange(active ? null : topic)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm transition-colors',
                active ? 'font-medium text-ink' : 'text-[#555] hover:text-ink dark:text-ink-2',
              )}
            >
              <span>{topic}</span>
              <span
                className={cn(
                  'min-w-[1.5rem] rounded px-1.5 py-0.5 text-xs tabular-nums',
                  active
                    ? 'bg-ink text-bg'
                    : 'bg-[#f4f4f5] text-[#888] dark:bg-bg-soft dark:text-ink-2',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 inline-flex items-center gap-0.5 text-sm text-[#555] transition-colors hover:text-ink dark:text-ink-2"
          >
            {expanded ? 'Collapse' : 'Expand'}
            {expanded ? (
              <ChevronsUp className="size-4" strokeWidth={2} />
            ) : (
              <ChevronsDown className="size-4" strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_PILLS.map((pill) => {
          const active = typeFilter === pill.id;
          const Icon = pill.icon;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onTypeChange(pill.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#282828] text-white dark:bg-ink dark:text-bg'
                  : 'bg-[#f4f4f5] text-[#555] hover:bg-[#ececee] dark:bg-bg-soft dark:text-ink-2 dark:hover:bg-bg-lav',
              )}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full',
                  active ? 'bg-white/15' : pill.iconBg,
                )}
              >
                <Icon
                  className={cn('size-3.5', active ? 'text-white' : pill.iconColor)}
                  strokeWidth={2}
                />
              </span>
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function matchesTypeFilter(type: string, filter: ProblemTypeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'mcq') return type === 'mcq';
  if (filter === 'code') return type === 'code';
  return type === 'short_answer' || type === 'prompt_design';
}
