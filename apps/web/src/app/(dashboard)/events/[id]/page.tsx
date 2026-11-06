import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CtfEventDetailRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(routes.contest(id));
}
