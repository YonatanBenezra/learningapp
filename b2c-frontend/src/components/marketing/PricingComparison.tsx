import { Check, Minus } from 'lucide-react';
import { Container } from './Container';
import { PLAN_COMPARISON } from '@/src/constants/pricing';
import { cn } from '@/src/lib/utils';

function CellValue({ value }: { value: string }) {
  if (value === '—') {
    return <Minus className="mx-auto size-4 text-ink-3" aria-hidden="true" />;
  }
  if (value === 'Yes') {
    return <Check className="mx-auto size-4 text-good" strokeWidth={2.5} aria-hidden="true" />;
  }
  return <span>{value}</span>;
}

export function PricingComparison() {
  return (
    <section className="border-t border-line bg-bg-soft pt-10 pb-10 sm:pb-14">
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Compare plans</h2>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
            Free, Standard, and Premium — aligned with your account tier and usage limits.
          </p>
        </div>

        <div className="mx-auto max-w-5xl overflow-x-auto rounded-2xl border border-line bg-bg-elev shadow-card">
          <div className="grid min-w-[720px] grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] border-b border-line bg-bg-soft px-4 py-4 text-sm font-semibold text-ink sm:px-6">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center">Standard</span>
            <span className="text-center text-primary">Premium</span>
          </div>
          {PLAN_COMPARISON.map((row, index) => (
            <div
              key={row.feature}
              className={cn(
                'grid min-w-[720px] grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] border-b border-line px-4 py-3.5 text-sm last:border-b-0 sm:px-6',
                index % 2 === 1 && 'bg-bg-soft/50',
              )}
            >
              <span className="font-medium text-ink">{row.feature}</span>
              <span className="text-center font-medium text-ink-2">
                <CellValue value={row.free} />
              </span>
              <span className="text-center font-medium text-ink-2">
                <CellValue value={row.standard} />
              </span>
              <span className="text-center font-semibold text-primary">
                <CellValue value={row.premium} />
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
