import { EventDetailsView } from "@/features/contests/event-details/event-details-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CtfEventDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <EventDetailsView slug={id} />;
}
