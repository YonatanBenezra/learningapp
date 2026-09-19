type IconProps = {
  size?: number;
  className?: string;
};

export function IconDescription({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 3.5h8a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 15V5A1.5 1.5 0 0 1 6 3.5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M7 7h6M7 10h6M7 13h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSteps({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="2.25" fill="currentColor" />
      <circle cx="15" cy="10" r="2.25" fill="currentColor" opacity="0.72" />
      <circle cx="5" cy="15" r="2.25" fill="currentColor" opacity="0.48" />
      <path
        d="M6.8 6.2 13.2 8.8M6.8 13.8 13.2 11.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSubmitDoc({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 3.5 15.5 9v6.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4.5 15.5V5A1.5 1.5 0 0 1 6 3.5h4Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="m10 3.5 5.5 5.5H11.5A1.5 1.5 0 0 1 10 10V3.5Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M10 11.5v3.5M8.25 13.25 10 15l1.75-1.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconExamples({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5"
        width="13"
        height="10"
        rx="1.5"
        fill="currentColor"
        opacity="0.16"
      />
      <rect
        x="5.5"
        y="7"
        width="9"
        height="2"
        rx="0.5"
        fill="currentColor"
        opacity="0.55"
      />
      <rect
        x="5.5"
        y="10.5"
        width="6"
        height="2"
        rx="0.5"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

export function IconHints({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 3.5a4.5 4.5 0 0 0-2.8 8.05V13h5.6v-1.45A4.5 4.5 0 0 0 10 3.5Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M10 3.5a4.5 4.5 0 0 0-2.8 8.05V13h5.6v-1.45A4.5 4.5 0 0 0 10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 15.25h3.5M9.25 17h1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCode({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 6 3.5 10 7 14M13 6l3.5 4-3.5 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconRun({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8.5 6.2v7.6l6.2-3.8-6.2-3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconSubmitCloud({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.5 14.5h7a2.5 2.5 0 0 0 .45-4.96A3.5 3.5 0 0 0 7.2 7.3 3 3 0 0 0 6.5 14.5Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M10 8.5v4M8.25 10.75 10 12.5l1.75-1.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTestResult({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="4.5"
        width="13"
        height="11"
        rx="1.5"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M6.5 9.5 8.5 11.5 13.5 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronLeft({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 4 6 8l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronRight({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronDown({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronUp({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="m4 10 4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPanelLayout({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="5" height="12" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="9.5" y="4" width="7.5" height="12" rx="1" fill="currentColor" opacity="0.16" />
    </svg>
  );
}
