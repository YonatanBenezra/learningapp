/** Figma Simulation Lab tab — two nodes linked by a diagonal line. */
export function SimLabWireframeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <circle cx="3.25" cy="10.75" r="1.35" fill="currentColor" />
      <circle cx="10.75" cy="3.25" r="1.35" fill="currentColor" />
      <path
        d="M4.2 9.8 L9.8 4.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}
