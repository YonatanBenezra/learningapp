import type { PracticeBannerVariant } from "@/features/practice-hub/types";
import { cn } from "@/lib/utils";

type ProblemBannerProps = {
  title: string;
  variant: PracticeBannerVariant;
  className?: string;
};

export function ProblemBanner({ title, variant, className }: ProblemBannerProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-sm",
        variant === "navy-grid" &&
          "bg-[linear-gradient(145deg,#151f2e_0%,#0d1524_55%,#101927_100%)]",
        variant === "lime-dark" &&
          "bg-[linear-gradient(160deg,#121c2b_0%,#1a2a12_45%,#101927_100%)]",
        variant === "blue-bright" &&
          "bg-[linear-gradient(135deg,#0ea5e9_0%,#1e3a8a_48%,#101927_100%)]",
        variant === "purple-soft" &&
          "bg-[linear-gradient(135deg,#6d28d9_0%,#1e2939_55%,#101927_100%)]",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <p className="absolute inset-0 flex items-center justify-center px-4 text-center font-[family-name:var(--font-oswald)] text-[1.5rem] font-bold uppercase leading-tight tracking-tight text-platform-text">
        {title.split(" ").slice(0, 4).join(" ")}
      </p>
    </div>
  );
}
