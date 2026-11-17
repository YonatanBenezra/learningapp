import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type LabpathLogoProps = {
  size?: "sm" | "md" | "foot";
  className?: string;
  /** Kept for API compatibility — wordmark is baked into the logo asset. */
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** Full lockup with tagline (footer / marketing). */
  withTagline?: boolean;
};

type LabpathLogoMarkProps = {
  className?: string;
};

const sizes = {
  sm: { className: "h-9 w-auto max-w-[min(100%,16rem)]" },
  md: { className: "h-11 w-auto max-w-[min(100%,18rem)]" },
  foot: { className: "h-[1.35rem] w-auto max-w-[12rem]" },
} as const;

const taglineSizes = {
  sm: { className: "h-10 w-auto max-w-[min(100%,14rem)]" },
  md: { className: "h-12 w-auto max-w-[min(100%,16rem)]" },
  foot: { className: "h-9 w-auto max-w-[13rem]" },
} as const;

/** Coral “S” mark — auth panels / compact lockups. */
export function LabpathLogoMark({ className }: LabpathLogoMarkProps) {
  return (
    <span className={cn("lp-brand-mark inline-flex", className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand mark */}
      <img
        src="/brand/ai-warss-favicon.svg"
        alt=""
        width={64}
        height={64}
        className="lp-brand-mark-glyph h-7 w-7 object-contain"
      />
    </span>
  );
}

/**
 * AI Warss logo.
 * - Navbar: `-header` (no tagline)
 * - Marketing: transparent full lockup with tagline
 * Theme swaps via CSS (`data-theme`) so SSR stays correct.
 */
export function LabpathLogo({
  size = "md",
  className,
  showWordmark: _showWordmark = false,
  wordmarkClassName: _wordmarkClassName,
  withTagline = false,
}: LabpathLogoProps) {
  const dim = withTagline ? taglineSizes[size] : sizes[size];

  const darkSrc = withTagline
    ? "/brand/ai-warss-dark-transparent.svg"
    : "/brand/ai-warss-dark-header.svg";
  const lightSrc = withTagline
    ? "/brand/ai-warss-light-transparent.svg"
    : "/brand/ai-warss-light-header.svg";
  const width = withTagline ? 606 : 416;
  const height = withTagline ? 196 : 80;

  return (
    <span
      className={cn("lp-brand-logo inline-flex items-center", className)}
      role="img"
      aria-label={brand.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand logo */}
      <img
        src={darkSrc}
        alt=""
        width={width}
        height={height}
        className={cn(
          "lp-brand-logo-dark shrink-0 object-contain object-left",
          dim.className,
        )}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand logo */}
      <img
        src={lightSrc}
        alt=""
        width={width}
        height={height}
        className={cn(
          "lp-brand-logo-light shrink-0 object-contain object-left",
          dim.className,
        )}
      />
    </span>
  );
}
