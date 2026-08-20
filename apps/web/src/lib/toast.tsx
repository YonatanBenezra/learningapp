'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Toaster, toast as hotToast, type Toast } from 'react-hot-toast';
import { cn } from '@/src/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

const variantStyles: Record<
  ToastVariant,
  { border: string; icon: string; Icon: React.ElementType }
> = {
  success: {
    border: 'border-good/25',
    icon: 'text-good',
    Icon: CheckCircle2,
  },
  error: {
    border: 'border-bad/25',
    icon: 'text-bad',
    Icon: AlertCircle,
  },
  info: {
    border: 'border-primary/25',
    icon: 'text-primary',
    Icon: Info,
  },
};

function CustomToast({
  t,
  message,
  variant,
}: {
  t: Toast;
  message: string;
  variant: ToastVariant;
}) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-[min(100vw-2rem,380px)] items-start gap-3 rounded-lg border bg-bg-elev px-4 py-3.5 shadow-[var(--shadow-elevated)] transition-all duration-300',
        styles.border,
        t.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', styles.icon)} strokeWidth={1.75} />
      <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-ink">{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => hotToast.dismiss(t.id)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition hover:bg-bg-soft hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function show(variant: ToastVariant, message: string) {
  return hotToast.custom((t) => <CustomToast t={t} message={message} variant={variant} />);
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
  dismiss: hotToast.dismiss,
};

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerClassName="!top-20"
      toastOptions={{
        duration: 4200,
      }}
    />
  );
}
