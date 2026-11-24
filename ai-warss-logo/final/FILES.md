# AI Warss — logo files

Each letter is drawn as an SVG shape, so no font needs to be installed. The tagline
is the only real text: it falls back to any monospace font if JetBrains Mono is missing.

## Which file to use

| File | Use it for |
|---|---|
| `ai-warss-dark.svg` | Main logo, dark background built in |
| `ai-warss-light.svg` | Main logo, light background built in |
| `ai-warss-dark-transparent.svg` | Drop onto your own dark background |
| `ai-warss-light-transparent.svg` | Drop onto your own light background |
| `ai-warss-dark-header.svg` | Site header / navbar — smaller, no tagline |
| `ai-warss-light-header.svg` | Same, for light headers |
| `ai-warss-mono-black.svg` | One-color black: print, invoices, stamps |
| `ai-warss-mono-white.svg` | One-color white: photos, dark merch |
| `ai-warss-icon.svg` | App icon, social avatar (512px, rounded) |
| `ai-warss-icon-square.svg` | Same icon with square corners |
| `ai-warss-favicon.svg` | Browser tab (64px, heavier stroke so it survives 16px) |

A `.png` sits next to each `.svg` at 2x. Use the SVG on the web; the PNG is for
places that will not take an SVG.

## Colors

| Role | Hex |
|---|---|
| Accent (the last S) | `#FF4D4D` |
| Dark background | `#0B0B0E` |
| Dark tile / tile edge | `#17181D` / `#2A2C34` |
| Light background | `#F4F5F7` |
| Ink on dark / on light | `#E9EBF0` / `#15171C` |
| Tagline | `#7A7D88` (dark), `#6B6F7A` (light) |

## Rules of thumb

- Leave clear space around the logo of at least one tile width.
- Do not stretch it — scale width and height together.
- Below roughly 160px wide, use a `-header` file; the tagline stops being legible.
- The red S tile is the icon. Do not invent a separate symbol.

## Regenerating

Edit `build_logo.py` (one level up) and run it; it rewrites every SVG in this folder.
See the README beside it for the full layout.

```bash
python3 ../build_logo.py
```
