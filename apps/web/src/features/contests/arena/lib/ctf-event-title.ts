const WEEKLY_PREFIX = /^Weekly Contest #\d+\s*/i;
const EMDASH = /\s*[—–-]\s*/;

/** Display title for CTF event chrome (nav, hero) — matches event details. */
export function ctfEventDisplayTitle(contestTitle: string): string {
  if (!WEEKLY_PREFIX.test(contestTitle)) {
    return contestTitle;
  }
  const rest = contestTitle.replace(WEEKLY_PREFIX, "").trim();
  if (!rest) {
    return "CTF Try Out";
  }
  const parts = rest.split(EMDASH).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1 && /^CTF Try Out$/i.test(parts[0]!)) {
    return "CTF Try Out";
  }
  if (parts.length >= 1) {
    const suffix = parts.join(" — ");
    return `CTF Try Out — ${suffix}`;
  }
  return "CTF Try Out";
}

const CTF_TRY_OUT = /^CTF Try Out$/i;

/** Muted H1 suffix after “CTF Try Out — …” (never repeats the brand line). */
export function contestHeroSubtitle(contestTitle: string, slug: string): string {
  const weekly = contestTitle.match(/^Weekly Contest #(\d+)\s*[—–-]\s*(.+)$/i);
  if (weekly) {
    const num = weekly[1]!;
    const suffix = weekly[2]!.trim();
    if (!CTF_TRY_OUT.test(suffix)) {
      return suffix;
    }
    if (/weekly-advanced/i.test(slug)) {
      return "Advanced";
    }
    return `Contest #${num}`;
  }

  const parts = contestTitle.split(EMDASH).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1]!;
    if (!CTF_TRY_OUT.test(tail)) {
      return tail;
    }
  }

  const fromSlug = slug.match(/(?:advanced|beta|tryout)[-_]?(\d+)/i);
  if (fromSlug?.[1]) {
    return `Contest #${fromSlug[1]}`;
  }

  return slug
    .split("-")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
