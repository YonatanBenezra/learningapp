import { brand } from "@/config/brand";

type LcLogoProps = {
  className?: string;
};

export function LcLogo({ className }: LcLogoProps) {
  return (
    <span className={`ag-lc-logo-wrap${className ? ` ${className}` : ""}`}>
      <svg className="ag-lc-logo-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M12 10h18l-12 14h14"
          stroke="#262626"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 38h-6"
          stroke="#8c8c8c"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M34 24l8 8"
          stroke="#ffa116"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="ag-lc-logo-name">{brand.name}</span>
    </span>
  );
}
