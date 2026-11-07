import EventHero from "@/features/contests/event-details/components/event-hero";
import { StatusBadge } from "@/features/contests/event-details/components/status-badge";
import type { EventBadgeKind } from "@/features/contests/event-details/types";

type HeroBannerProps = {
  title: string;
  badges: EventBadgeKind[];
};

/** Short label for the centered card (reference shows "CTF Try Out", not the full H1). */
function cardTitleFrom(full: string): string {
  const head = full.split(/\s[—–-]\s/)[0]?.trim();
  return head && head.length > 0 ? head : full;
}

export function HeroBanner({ title, badges }: HeroBannerProps) {
  return (
    <section className="w-full" aria-label="Event hero">
      <EventHero title={cardTitleFrom(title)} />
      {badges.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((b) => (
            <StatusBadge key={b} kind={b} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
