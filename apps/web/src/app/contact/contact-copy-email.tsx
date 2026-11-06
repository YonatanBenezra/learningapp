"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ContactCopyEmail({ email }: { email: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  return (
    <button type="button" className="lp-contact-copy-btn" onClick={copy}>
      {done ? (
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      )}
      {done ? "Copied" : "Copy address"}
    </button>
  );
}
