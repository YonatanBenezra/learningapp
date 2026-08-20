import { InfoTip } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  tip?: string;
  align?: 'left' | 'center';
  variant?: 'default' | 'glass';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tip,
  align = 'center',
  variant = 'default',
  className,
}: SectionHeadingProps) {
  const glass = variant === 'glass';

  return (
    <div
      className={cn(
        'max-w-3xl animate-fade-in',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold',
            glass
              ? 'border border-line bg-bg-elev text-primary dark:border-white/15 dark:bg-white/10 dark:text-white/90 backdrop-blur-sm'
              : 'bg-primary-soft text-primary',
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <div
        className={cn(
          'flex items-center gap-2',
          align === 'center' && 'justify-center',
          eyebrow && 'mt-4',
        )}
      >
        <h2
          className={cn(
            'text-[32px] font-bold leading-[1.2] tracking-tight sm:text-[40px] lg:text-[44px]',
            glass ? 'text-ink dark:text-white' : 'text-ink',
          )}
        >
          {title}
        </h2>
        {tip ? <InfoTip content={tip} label={`About ${title}`} /> : null}
      </div>
      {description ? (
        <p
          className={cn(
            'mt-3 text-base leading-relaxed sm:text-lg',
            glass ? 'text-ink-2 dark:text-white/75' : 'text-ink-2',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
