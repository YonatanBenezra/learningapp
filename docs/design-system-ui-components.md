# UI components & navbar states (Figma handoff)

Reference for the **LabPath marketing + catalog** shell. Tokens live in `apps/web/src/app/tokens.css` and `typography.css`. Implementation pass: **components first, then navbar states on home hero**.

---

## Component inventory (auto-layout variants)

| Component | Variants / states | Notes |
|-----------|-------------------|--------|
| **Logo lockup** | Wordmark + mark; light / on-tint | `LabpathLogo`, optional “by Bina” |
| **Button primary** | Default, hover, disabled | Ember fill, `on-ember` text (light) |
| **Button secondary** | Outline ember | Ghost on dark |
| **Button ghost** | Text + subtle hover | “Sign in”, tertiary actions |
| **Button sm** | Same hierarchy, compact | Nav CTA, chips |
| **Nav link** | Default, hover, **active** | Active: ink + **signal teal** underline (2px) |
| **Theme toggle** | Sun / moon, nav pill | Not floating rail on catalog |
| **Badge** | Public beta (ember), neutral, signal | Mono label typography |
| **Email capture** | Default, focus | Footer / hero — icon + field + arrow CTA |
| **Search** | Default, focus | “Search problems” + `/` kbd |
| **Footer** | 4 columns + legal row | Product, tracks, contact, social |

**Target CSS classes (to align or add):**

- Buttons: unify `lp-ct-btn` + `lp-site-nav-signin` → `lp-btn`, `lp-btn--primary`, `lp-btn--secondary`, `lp-btn--ghost`, `lp-btn--sm`
- Badges: `lp-badge`, `lp-badge--ember`, `lp-badge--neutral`, `lp-badge--signal`
- Nav links: `lp-nav-menu-link` (exists)

---

## Navbar states (`Nav/Home` in context)

### Desktop

| State | Height | Background | Border / elevation |
|-------|--------|------------|-------------------|
| **Default (on hero)** | **72px** | Transparent — sits on hero grid | No shadow |
| **Scrolled** | **56px** | Canvas **~78% opacity** + **16px backdrop blur** | **1px** bottom border + **E1** (light); dark: raised surface + border, **~30% shadow** |

**Default row (left → right):**

1. Logo (+ optional endorsement)
2. Links: Problems · Contest · Leaderboard
3. Search (catalog)
4. Theme toggle
5. Sign in (ghost)
6. **Open problems** (primary sm)

**On home hero only:** optional center/bottom **PUBLIC BETA · PRACTICE PLATFORM…** pill (mono label + ember dot).

### Mobile

| State | Height | Chrome |
|-------|--------|--------|
| **Default** | **64px** | Logo · Sign in · menu |
| **Scrolled** | **56px** | Same, compact |
| **Menu open** | Full sheet | Close **X**; large rows with **title + subcopy + chevron**; bottom **Appearance** + theme; primary **Open problems** + secondary **Sign in** |

Mobile menu copy (Figma):

- **Problems** — “20+ graded exercises”
- **Contest** — “Timed sprints with live standings”
- **Leaderboard** — “Top scores this month”

---

## Mapping to codebase (today → next pass)

| Area | Current | Next pass |
|------|---------|-----------|
| Nav component | `AppCatalogNav` + `site-nav.css` | Scroll shrink 72→56, transparent on `/` only |
| Nav height | `--lp-dash-nav-h: 4rem` (64px) | 72px default desktop, 56px scrolled |
| Home nav context | Same opaque catalog bar | `data-nav-context="hero"` on `/` for transparent default |
| Primary CTA in nav | Auth slot mixes sign-in styling | Separate ghost Sign in + primary Open problems |
| Mobile menu | Flat link list | Sheet + subcopy + chevrons + appearance block |
| Buttons | Split across contests + nav | Shared `lp-btn` variants per Figma |
| Footer | Minimal `lp-app-foot` on home | Full footer component from Figma |

---

## Implementation order (when we start)

1. **Shared buttons + badges** (`components/ui` or `components/lp/`)
2. **Navbar desktop** — heights, scroll listener, hero transparency
3. **Navbar mobile** — sheet layout + copy
4. **Wire home hero** — beta pill under nav; hand note (Caveat) near CTA
5. **Footer** block on marketing home

Do not change simulator workspace chrome in this pass — catalog + home only.
