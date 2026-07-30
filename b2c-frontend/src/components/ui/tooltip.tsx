'use client';

import {
  useId,
  useState,
  useRef,
  useLayoutEffect,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type TooltipSide = 'top' | 'bottom';

function useTooltipPosition(open: boolean, side: TooltipSide, triggerRef: React.RefObject<HTMLElement | null>) {
  const [style, setStyle] = useState<CSSProperties>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const node = triggerRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const left = rect.left + rect.width / 2;

      if (side === 'top') {
        setStyle({
          top: rect.top - 8,
          left,
          transform: 'translate(-50%, -100%)',
        });
        return;
      }

      setStyle({
        top: rect.bottom + 8,
        left,
        transform: 'translate(-50%, 0)',
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, side, triggerRef]);

  return style;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const positionStyle = useTooltipPosition(open, side, triggerRef);

  const tooltip =
    open && typeof document !== 'undefined'
      ? createPortal(
          <span
            id={id}
            role="tooltip"
            style={positionStyle}
            className="pointer-events-none fixed z-[9999] w-max max-w-[260px] rounded-lg border border-line bg-bg-elev px-3 py-2 text-xs leading-5 text-ink-2 shadow-lift animate-fade-in"
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('relative inline-flex max-w-full', className)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={() => setOpen(false)}
      >
        <span aria-describedby={open ? id : undefined}>{children}</span>
      </span>
      {tooltip}
    </>
  );
}

export function InfoTip({
  content,
  label = 'More info',
  className,
  side = 'top',
}: {
  content: string;
  label?: string;
  className?: string;
  side?: TooltipSide;
}) {
  return (
    <Tooltip content={content} side={side} className={className}>
      <button
        type="button"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-bg-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={label}
      >
        <HelpCircle className="size-3.5" />
      </button>
    </Tooltip>
  );
}
