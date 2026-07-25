import { Container } from './Container';
import { PLAN_COMPARISON } from '@/src/constants/pricing';

export function PricingComparison() {
  return (
    <section className="border-t border-line bg-bg-soft py-16 sm:py-20">
      <Container>
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-ink">
            Compare plans
          </h2>
          <p className="mt-3 text-sm text-ink-2 sm:text-base">
            Free, Standard, and Premium — matching your account tier.
          </p>
        </div>

        <div className="mx-auto max-w-[980px] overflow-x-auto rounded-lg border border-line bg-bg-elev shadow-soft">
          <div className="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-b border-line bg-bg-soft px-4 py-4 text-sm font-semibold text-ink sm:px-6">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center">Standard</span>
            <span className="text-center text-primary">Premium</span>
          </div>
          {PLAN_COMPARISON.map((row) => (
            <div
              key={row.feature}
              className="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-b border-line px-4 py-3.5 text-sm last:border-b-0 sm:px-6"
            >
              <span className="text-ink-2">{row.feature}</span>
              <span className="text-center font-medium text-ink">{row.free}</span>
              <span className="text-center font-medium text-ink">{row.standard}</span>
              <span className="text-center font-semibold text-primary">{row.premium}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
