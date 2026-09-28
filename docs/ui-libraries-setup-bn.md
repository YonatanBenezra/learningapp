# UI Libraries Setup (Magic UI, Aceternity, Motion, Three.js)

## ইনস্টল করা packages (`apps/web`)

| Package | কাজ |
|---------|-----|
| **shadcn** + **@base-ui/react** | Component CLI + base primitives |
| **motion** | Animation (Framer Motion successor) — `import from "@/lib/motion"` |
| **three** + **@types/three** | WebGL backgrounds (`StarfieldCanvas`) |
| **clsx**, **tailwind-merge**, **cva** | `cn()` utility |
| **lucide-react** | Icons (shadcn/Magic UI) |
| **tw-animate-css** | Tailwind animation utilities |

## shadcn + Magic UI

- Config: `apps/web/components.json`
- Registry: `@magicui` → `https://magicui.design/r/{name}.json`

নতুন Magic UI component add:

```bash
cd apps/web
npx shadcn@latest add @magicui/<component-name> --yes
```

ইতিমধ্যে add করা:

- `dot-pattern`
- `shimmer-button`
- `animated-shiny-text`

## Aceternity UI

Aceternity-র official shadcn registry নেই। Manual ports:

- `src/components/ui/aceternity/spotlight.tsx`
- `src/components/ui/aceternity/background-beams.tsx`

আরও component: [ui.aceternity.com](https://ui.aceternity.com) থেকে copy করে `aceternity/` folder-এ রাখো; `cn()` + `motion` use করো।

## Motion

```tsx
import { motion } from "@/lib/motion";
```

## Three.js

```tsx
import { StarfieldCanvas } from "@/components/ui/three/starfield-canvas";
```

Hero/landing-এ optional background; workspace-এ sparingly (performance)।

## Theme + dark mode

LabPath uses `data-theme="dark"` **and** `.dark` class (shadcn/Magic UI compatible).  
Toggle: `applyTheme()` in `src/features/theme/theme.ts`.

## Import barrel

```tsx
import { DotPattern, Spotlight, ShimmerButton } from "@/components/ui";
```

## Example usage

`/simulations` page hero — `DotPattern` + `Spotlight` + `AnimatedShinyText`.
