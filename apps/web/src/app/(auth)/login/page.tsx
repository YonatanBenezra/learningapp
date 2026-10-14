import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

type LoginRedirectProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginRedirectPage({ searchParams }: LoginRedirectProps) {
  const params = await searchParams;
  const next = params.next;
  redirect(next ? `${routes.signIn}?next=${encodeURIComponent(next)}` : routes.signIn);
}
