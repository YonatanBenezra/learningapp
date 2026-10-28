"use client";

import {
  Activity,
  Clock,
  Droplet,
  Flag,
  Lock,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import "../lab-state-toast.css";

export type LabStateToastKind =
  | "running"
  | "flag-captured"
  | "first-blood"
  | "no-flag"
  | "time-low"
  | "clock-expired";

export type LabStateToastItem = {
  id: string;
  kind: LabStateToastKind;
  title: string;
  detail: string;
  points?: string;
  badge?: string;
  actionHref?: string;
  actionLabel?: string;
  dismissible?: boolean;
};

const ICON: Record<LabStateToastKind, LucideIcon> = {
  running: Activity,
  "flag-captured": Flag,
  "first-blood": Droplet,
  "no-flag": X,
  "time-low": Clock,
  "clock-expired": Lock,
};

const MOD: Record<LabStateToastKind, string> = {
  running: "lp-lab-toast--running",
  "flag-captured": "lp-lab-toast--flag",
  "first-blood": "lp-lab-toast--first-blood",
  "no-flag": "lp-lab-toast--fail",
  "time-low": "lp-lab-toast--warn",
  "clock-expired": "lp-lab-toast--expired",
};

export function LabStateToastStack({
  items,
  onDismiss,
}: {
  items: LabStateToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="lp-lab-toast-stack" aria-live="polite" aria-label="Lab status">
      {items.map((item) => (
        <LabStateToast key={item.id} item={item} />
      ))}
    </div>
  );
}

function LabStateToast({ item }: { item: LabStateToastItem }) {
  const Icon = ICON[item.kind];
  return (
    <article className={`lp-lab-toast ${MOD[item.kind]}`}>
      <span className="lp-lab-toast-icon" aria-hidden>
        <Icon className="size-4" strokeWidth={2.25} />
      </span>
      <div className="lp-lab-toast-body">
        <p className="lp-lab-toast-title">{item.title}</p>
        <p className="lp-lab-toast-detail">{item.detail}</p>
      </div>
      <div className="lp-lab-toast-side">
        {item.points ? <span className="lp-lab-toast-points">{item.points}</span> : null}
        {item.badge ? (
          item.actionHref ? (
            <Link href={item.actionHref} className="lp-lab-toast-badge">
              {item.badge}
            </Link>
          ) : (
            <span className="lp-lab-toast-badge">{item.badge}</span>
          )
        ) : null}
      </div>
    </article>
  );
}

export function labToastId(): string {
  return `lab-toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
