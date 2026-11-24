import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type LabpathLogoProps = {
  size?: "sm" | "md" | "foot";
  className?: string;
  /** Kept for API compatibility — wordmark is baked into the logo asset. */
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** Stacked lockup (footer / marketing). */
  withTagline?: boolean;
};

type LabpathLogoMarkProps = {
  className?: string;
};

const sizes = {
  sm: { className: "h-9 w-auto max-w-[min(100%,15rem)]" },
  md: { className: "h-10 w-auto max-w-[min(100%,17rem)]" },
  foot: { className: "h-7 w-auto max-w-[12rem]" },
} as const;

const stackedSizes = {
  sm: { className: "h-10 w-auto max-w-[min(100%,8.5rem)]" },
  md: { className: "h-11 w-auto max-w-[min(100%,9.5rem)]" },
  foot: { className: "h-9 w-auto max-w-[8rem]" },
} as const;

/** Compact mark — red glyph on transparent (auth / lockups). */
export function LabpathLogoMark({ className }: LabpathLogoMarkProps) {
  return (
    <span className={cn("lp-brand-mark inline-flex", className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand mark */}
      <img
        src="/brand/ai-warss-icon-red-on-dark.svg"
        alt=""
        width={480}
        height={480}
        className="lp-brand-mark-glyph h-7 w-7 object-contain"
      />
    </span>
  );
}

/**
 * AI Warss logo from `ai-warss-svg-transparent`.
 * - Navbar: horizontal wordmark
 * - Marketing: stacked lockup (`withTagline`)
 * Theme swaps via CSS (`data-theme`).
 */
export function LabpathLogo({
  size = "md",
  className,
  showWordmark: _showWordmark = false,
  wordmarkClassName: _wordmarkClassName,
  withTagline = false,
}: LabpathLogoProps) {
  const dim = withTagline ? stackedSizes[size] : sizes[size];

  // Dark UI: white + coral. Light UI: red on white.
  const darkSrc = withTagline
    ? "/brand/ai-warss-stacked-white-on-dark.svg"
    : "/brand/ai-warss-horizontal-white-on-dark.svg";
  const lightSrc = withTagline
    ? "/brand/ai-warss-stacked-red-on-white.svg"
    : "/brand/ai-warss-horizontal-red-on-white.svg";
  // Intrinsic sizes after viewBox crop (approx).
  const width = withTagline ? 400 : 870;
  const height = withTagline ? 400 : 220;

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
