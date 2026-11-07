export function FlagIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse
        cx="80"
        cy="128"
        rx="54"
        ry="9"
        stroke="#64748B"
        strokeWidth="1.2"
        strokeDasharray="3 4.5"
        opacity="0.9"
      />
      <path d="M80 28V126" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M82 36H82C82 36 124 44 124 68C124 92 108 104 92 108H82V36Z"
        fill="#9FEF00"
      />
      <path
        d="M84 40L112 64L104 88L84 100V40Z"
        fill="#7BC400"
        fillOpacity="0.45"
      />
      <path d="M84 44L108 68L84 92V44Z" fill="#0F1520" fillOpacity="0.12" />
    </svg>
  );
}
