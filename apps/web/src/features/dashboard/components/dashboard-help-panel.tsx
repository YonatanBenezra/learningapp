"use client";

import { LifeBuoy, ThumbsUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

type HelpLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  icon: LucideIcon;
};

const HELP_LINKS: HelpLink[] = [
  {
    id: "help-center",
    label: "Help center",
    href: "https://github.com/Bina-Labs/Labpath#documentation",
    external: true,
    icon: LifeBuoy,
  },
  {
    id: "feedback",
    label: "Give us feedback",
    href: "mailto:hello@labpath.dev?subject=LabPath%20Feedback",
    icon: ThumbsUp,
  },
];

type DashboardHelpPanelProps = {
  open: boolean;
  anchor: { top: number; right: number };
  onClose: () => void;
};

const E = [0.2, 0, 0, 1] as const;

export function DashboardHelpPanel({ open, anchor, onClose }: DashboardHelpPanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="lp-dash-updates-scrim"
            aria-label="Close help menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.nav
            aria-label="Help"
            className="lp-dash-help-panel"
            style={{ top: anchor.top, right: anchor.right }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: E }}
          >
            <ul className="lp-dash-help-list">
              {HELP_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="lp-dash-help-link"
                      onClick={onClose}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <Icon className="lp-dash-help-link-icon" strokeWidth={2.1} aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
