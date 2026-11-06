import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  danger?: boolean;
  id?: string;
};

export function SectionCard({
  title,
  description,
  children,
  className,
  danger,
  id,
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-lg bg-[#151F2E] px-4 py-6",
        danger && "border border-[#F35E5E40]",
        className,
      )}
    >
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-[#F4F4F4]">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-[#8799B5]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
