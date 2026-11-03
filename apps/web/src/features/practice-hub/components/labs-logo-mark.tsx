/** 26px lime hex outline — Labs hub (same family as CTF mark). */
export function LabsLogoMark({ className }: { className?: string }) {
  return (
    <svg width={26} height={26} viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 4l14 8v16l-14 8-14-8V12L20 4z"
        fill="none"
        stroke="#9FEF00"
        strokeWidth="2"
      />
      <path d="M12 20h16M20 12v16" fill="none" stroke="#9FEF00" strokeWidth="1.5" />
    </svg>
  );
}
