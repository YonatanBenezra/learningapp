import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

type RegisterRedirectProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterRedirectPage({ searchParams }: RegisterRedirectProps) {
  const params = await searchParams;
  const next = params.next;
  redirect(next ? `${routes.signUp}?next=${encodeURIComponent(next)}` : routes.signUp);
}
