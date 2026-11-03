# Neue Haas Unica

**Production:** load from [Adobe Fonts](https://fonts.adobe.com/) (Typekit) — set `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` in `apps/web/.env.local`. Include weights **400, 500, 600, 700, 800** and family **`neue-haas-unica`** in the web project.

**Fallback (no kit / offline dev):** place licensed WOFF2 here or rely on **DM Sans** (400) from Google Fonts in `layout.tsx`.

| File | Weight |
|------|--------|
| `NeueHaasUnica-Roman.woff2` | 400 |
| `NeueHaasUnica-Medium.woff2` | 500 |
| `NeueHaasUnica-Bold.woff2` | 600 |
| `NeueHaasUnica-Black.woff2` | 700, 800 |

Do not commit font files unless your license allows redistribution.

**Free stand-ins** when Unica is unavailable: Inter or DM Sans (already wired as sans fallback).
