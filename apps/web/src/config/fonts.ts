/**
 * Brand typography — Neue Haas Unica via Adobe Fonts (Typekit) in production.
 * Set NEXT_PUBLIC_ADOBE_FONTS_KIT_ID to your kit id (use.typekit.net/{id}.css).
 * Without a kit, the stack falls back to self-hosted WOFF2 (if present) then DM Sans.
 */
export const adobeFontsKitId =
  process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID?.trim() || null;

export const hasAdobeFontsKit = Boolean(adobeFontsKitId);

/** CSS font-family token (matches Adobe / Figma: neue-haas-unica). */
export const brandSansFamily =
  'neue-haas-unica, "Neue Haas Unica", var(--font-dm-sans), "DM Sans", sans-serif';
