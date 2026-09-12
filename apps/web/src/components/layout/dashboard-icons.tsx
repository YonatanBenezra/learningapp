function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="lp-dash-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <Svg>
      <circle cx="8" cy="5.4" r="2.6" />
      <path d="M2.9 13.4a5.1 5.1 0 0 1 10.2 0" />
    </Svg>
  );
}

export function ProgressIcon() {
  return (
    <Svg>
      <path d="M2.4 13.6h11.2" />
      <path d="M4.6 13.6V8.2" />
      <path d="M8 13.6V4.4" />
      <path d="M11.4 13.6v-3.4" />
    </Svg>
  );
}

export function BillingIcon() {
  return (
    <Svg>
      <rect x="1.9" y="3.6" width="12.2" height="8.8" rx="1.6" />
      <path d="M1.9 6.8h12.2" />
      <path d="M4.6 10h2.2" />
    </Svg>
  );
}

export function CatalogueIcon() {
  return (
    <Svg>
      <rect x="2" y="2" width="5" height="5" rx="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" />
    </Svg>
  );
}

export function PathsIcon() {
  return (
    <Svg>
      <circle cx="4" cy="4" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <path d="M4 5.8v2.4a2.4 2.4 0 0 0 2.4 2.4h3.8" />
    </Svg>
  );
}

export function ContestsIcon() {
  return (
    <Svg>
      <path d="M4.8 2.4h6.4v3.4a3.2 3.2 0 0 1-6.4 0V2.4Z" />
      <path d="M4.8 3.6H2.9v1a2 2 0 0 0 2 2" />
      <path d="M11.2 3.6h1.9v1a2 2 0 0 1-2 2" />
      <path d="M8 9v2.6" />
      <path d="M5.6 13.6h4.8" />
    </Svg>
  );
}

export function LeaderboardIcon() {
  return (
    <Svg>
      <rect x="6.2" y="3" width="3.6" height="10.6" rx="1" />
      <rect x="1.9" y="7.2" width="3.6" height="6.4" rx="1" />
      <rect x="10.5" y="5.4" width="3.6" height="8.2" rx="1" />
    </Svg>
  );
}
