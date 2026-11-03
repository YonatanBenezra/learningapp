import { EventCard } from "@/features/ctf-events/components/event-card";
import type { CtfEvent } from "@/features/ctf-events/types";

type EventGridProps = {
  events: CtfEvent[];
};

export function EventGrid({ events }: EventGridProps) {
  if (events.length === 0) {
    return (
      <p className="py-16 text-center text-sm tracking-[0.14px] text-platform-muted">
        No events in this tab. Try Upcoming, Joined, or Past — or clear your search.
      </p>
    );
  }

  return (
    <section
      className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="CTF events"
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </section>
  );
}
