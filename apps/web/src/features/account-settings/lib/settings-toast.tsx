"use client";

import { Check } from "lucide-react";
import toast from "react-hot-toast";

export function showSettingsSaved(message = "Changes saved") {
  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-2.5 rounded-lg border border-[#2A3547] bg-[#1E2939] px-4 py-3 text-sm font-medium text-[#F4F4F4] shadow-lg shadow-black/40 ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
        role="status"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-[#9FEF00]/15 text-[#9FEF00]">
          <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
        </span>
        {message}
      </div>
    ),
    { position: "bottom-right", duration: 3200 },
  );
}
