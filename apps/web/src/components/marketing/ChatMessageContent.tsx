import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

function formatInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <strong key={`${match.index}-b`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('*')) {
      parts.push(<em key={`${match.index}-i`}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={`${match.index}-a`}
            href={linkMatch[2]}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : [text];
}

function stripHeadingMarkers(line: string): string {
  return line.replace(/^#{1,6}\s+/, '').trim();
}

export function ChatMessageContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${key++}`} className="my-1.5 list-disc space-y-1 pl-4">
        {listItems.map((item, i) => (
          <li key={i}>{formatInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
      continue;
    }

    flushList();

    if (/^#{1,6}\s/.test(trimmed)) {
      blocks.push(
        <p key={`h-${key++}`} className="mb-1 font-semibold text-ink">
          {formatInline(stripHeadingMarkers(trimmed))}
        </p>,
      );
      continue;
    }

    blocks.push(
      <p key={`p-${key++}`} className="[&:not(:last-child)]:mb-1.5">
        {formatInline(trimmed)}
      </p>,
    );
  }

  flushList();

  return <div className={cn('break-words', className)}>{blocks}</div>;
}
