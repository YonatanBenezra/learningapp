import { cn } from '@/src/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className={cn('text-[32px] font-bold leading-[1.2] tracking-tight text-ink sm:text-[40px] lg:text-[44px]', eyebrow && 'mt-4')}>
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-ink-2 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
