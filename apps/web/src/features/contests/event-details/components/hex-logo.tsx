type HexLogoProps = {
  className?: string;
  size?: number;
};

/** Original hex/cube mark — not copied from third-party brands. */
export function HexLogo({ className, size = 28 }: HexLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
        stroke="#9FEF00"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z"
        fill="#9FEF00"
        fillOpacity="0.35"
      />
      <path d="M16 10V24M10 13.5L22 20.5M22 13.5L10 20.5" stroke="#9FEF00" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}
