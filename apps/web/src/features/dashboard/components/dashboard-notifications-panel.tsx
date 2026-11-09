"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  LABPATH_CHANGELOG_RSS_URL,
  LABPATH_CHANGELOG_URL,
  platformUpdates,
} from "@/features/dashboard/data/platform-updates";

export type { PlatformUpdate as DashboardUpdate, PlatformUpdateKind as UpdateKind } from "@/features/dashboard/data/platform-updates";

type DashboardNotificationsPanelProps = {
  open: boolean;
  anchor: { top: number; right: number };
  onClose: () => void;
};

const E = [0.2, 0, 0, 1] as const;

export function DashboardNotificationsPanel({
  open,
  anchor,
  onClose,
}: DashboardNotificationsPanelProps) {
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
            aria-label="Close latest updates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-latest-updates-title"
            className="lp-dash-updates-panel"
            style={{ top: anchor.top, right: anchor.right }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: E }}
          >
            <h2 id="dash-latest-updates-title" className="lp-dash-updates-title">
              Latest Updates
            </h2>

            {platformUpdates.length > 0 ? (
              <ul className="lp-dash-updates-list">
                {platformUpdates.map((item) => (
                  <li
                    key={item.id}
                    className={`lp-dash-updates-item lp-dash-updates-item--${item.kind}`}
                  >
                    <div className="lp-dash-updates-item-inner">
                      <p className="lp-dash-updates-item-heading">
                        <span
                          className={`lp-dash-updates-badge lp-dash-updates-badge--${item.kind}`}
                        >
                          {item.kind === "new" ? "New" : "Improved"}
                        </span>
                        <span className="lp-dash-updates-item-title">{item.title}</span>
                      </p>
                      <p className="lp-dash-updates-item-body">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lp-dash-updates-empty">
                No in-app release notes yet. Follow the changelog on GitHub for releases.
              </p>
            )}

            <footer className="lp-dash-updates-foot">
              <span className="lp-dash-updates-foot-muted">LabPath changelog</span>
              <span className="lp-dash-updates-foot-links">
                <a
                  href={LABPATH_CHANGELOG_RSS_URL}
                  className="lp-dash-updates-foot-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  RSS
                </a>
                <a
                  href={LABPATH_CHANGELOG_URL}
                  className="lp-dash-updates-foot-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  See all changes
                </a>
              </span>
            </footer>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
