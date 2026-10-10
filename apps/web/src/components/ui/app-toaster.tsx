"use client";

import { Toaster } from "react-hot-toast";
import "./app-toaster.css";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerClassName="lp-toast-host"
      toastOptions={{
        className: "lp-toast",
        duration: 4200,
        style: {
          background: "var(--color-card)",
          color: "var(--color-ink)",
          border: "1px solid color-mix(in srgb, var(--color-line) 85%, transparent)",
          borderRadius: "0.625rem",
          padding: "0.65rem 0.85rem",
          fontSize: "0.875rem",
          fontWeight: 550,
          boxShadow:
            "0 16px 40px color-mix(in srgb, #020617 32%, transparent)",
        },
        success: {
          duration: 3200,
          iconTheme: {
            primary: "var(--color-brand)",
            secondary: "var(--color-brand-on)",
          },
        },
        error: {
          duration: 4800,
          iconTheme: {
            primary: "var(--color-danger)",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
