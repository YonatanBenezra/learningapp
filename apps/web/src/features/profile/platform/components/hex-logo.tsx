import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type HexLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function HexLogo({ className, showWordmark = true }: HexLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width={32} height={32} viewBox="0 0 40 40" aria-hidden>
        <path
          d="M20 4l14 8v16l-14 8-14-8V12L20 4z"
          fill="#151F2E"
          stroke="#9FEF00"
          strokeWidth="2"
        />
        <path d="M20 14l6 3.5v7L20 28l-6-3.5v-7L20 14z" fill="#9FEF00" opacity={0.85} />
      </svg>
      {showWordmark ? (
        <span className="text-base font-semibold tracking-tight text-platform-text">{brand.name}</span>
      ) : null}
    </div>
  );
}
