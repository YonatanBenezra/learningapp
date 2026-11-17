# AI Warss — logo

Everything for the AI Warss brand mark lives in this folder.

```
ai-warss-logo/
├── final/          ← the logo in use. Start here.
│   └── FILES.md    ← which file to use where, colors, rules
├── concepts/       ← the five earlier styles, kept for reference
└── build_logo.py   ← regenerates everything in final/
```

## The mark

The name is set in seven tiles, one letter each. The last **S** sits in a red tile
with the letter knocked out — that is what makes the doubled S read as deliberate,
and that single tile doubles as the app icon and favicon. There is no separate
symbol; do not invent one.

Every letter is an SVG shape, not type, so no font has to be installed anywhere.
Only the tagline is real text, and it falls back to any monospace font.

## Quick start

- Website header → `final/ai-warss-dark-header.svg` (or the light one)
- Anywhere with room for the tagline → `final/ai-warss-dark.svg`
- Browser tab → `final/ai-warss-favicon.svg`
- App or social avatar → `final/ai-warss-icon.svg`

`final/FILES.md` has the full table, the hex codes, and the spacing rules.

## Concepts

`concepts/` holds the five styles that were not chosen — wordmark, pixel, glitch,
line and editorial. Nothing there is wired to the build script; they are frozen as
they were. Kept in case one of them is useful later for a campaign or a sub-brand.

## Changing the logo

Edit `build_logo.py` — the colors are in `THEMES` near the top, the letterforms in
`GLYPH` — then run it from anywhere:

```bash
python3 ai-warss-logo/build_logo.py
```

It rewrites every SVG in `final/`. The PNGs next to them are exports, so re-export
those yourself after a change.
