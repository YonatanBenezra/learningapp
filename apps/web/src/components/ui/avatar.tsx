import { cn } from '@/src/lib/utils';

function initialsOf(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  return (
    <span
      // Image (if any) via background so we don't fight next/image sizing for tiny avatars.
      style={src ? { backgroundImage: `url("${src}")`, backgroundSize: 'cover' } : undefined}
      className={cn(
        'inline-grid size-9 place-items-center rounded-full bg-primary-soft bg-center text-sm font-semibold text-primary',
        className,
      )}
      aria-label={name}
    >
      {src ? '' : initialsOf(name)}
    </span>
  );
}
