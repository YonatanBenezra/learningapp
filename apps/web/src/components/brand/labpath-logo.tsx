import Image from "next/image";
import { cn } from "@/lib/utils";

type LabpathLogoProps = {
  size?: "sm" | "md" | "foot";
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

type LabpathLogoMarkProps = {
  className?: string;
};

/** Source asset is 202×236 — height-led sizing avoids square box side padding. */
const LOGO_W = 202;
const LOGO_H = 236;

const sizes = {
  sm: { className: "h-8 w-auto" },
  md: { className: "h-9 w-auto" },
  foot: { className: "h-[18px] w-auto" },
} as const;

/** Orange square mark — navbar / footer Figma spec. */
export function LabpathLogoMark({ className }: LabpathLogoMarkProps) {
  return (
    <span className={cn("lp-brand-mark", className)} aria-hidden>
      <Image
        src="/brand/labpath-logo.png"
        alt=""
        width={LOGO_W}
        height={LOGO_H}
        className="lp-brand-mark-glyph object-contain"
      />
    </span>
  );
}

export function LabpathLogo({
  size = "md",
  className,
  showWordmark = false,
  wordmarkClassName,
}: LabpathLogoProps) {
  const dim = sizes[size];

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Image
        src="/brand/labpath-logo.png"
        alt=""
        width={LOGO_W}
        height={LOGO_H}
        className={cn("shrink-0 object-contain", dim.className)}
        priority
      />
      {showWordmark ? (
        <span className={cn("lp-site-nav-wordmark", wordmarkClassName)}>LabPath</span>
      ) : null}
    </span>
  );
}
