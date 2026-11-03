/** 26px lime hexagon cube outline for CTF navbar. */
export function CtfLogoMark({ className }: { className?: string }) {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
    >
      <path
        d="M20 4l14 8v16l-14 8-14-8V12L20 4z"
        fill="none"
        stroke="#9FEF00"
        strokeWidth="2"
      />
      <path
        d="M20 12l8 4.5v9L20 30l-8-4.5v-9L20 12z"
        fill="none"
        stroke="#9FEF00"
        strokeWidth="1.5"
      />
    </svg>
  );
}
