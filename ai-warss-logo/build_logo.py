#!/usr/bin/env python3
"""Generates every AI Warss logo variant from one definition.

Run:  python3 build_logo.py
Letters are drawn as plain SVG shapes, so no font has to be installed anywhere.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "final")

# --- letterforms, each drawn inside a 56 x 66 box -------------------------
GLYPH = {
    "A": '<polyline points="4,62 28,4 52,62"/><line x1="14" y1="40" x2="42" y2="40"/>',
    "I": '<line x1="28" y1="4" x2="28" y2="62"/>',
    "W": '<polyline points="4,4 15,62 28,22 41,62 52,4"/>',
    "R": '<path d="M10,62 V4 H34 a15,15 0 0 1 0,30 H10 M32,34 L50,62"/>',
    "S": '<path d="M48,8 H18 a13,13 0 0 0 0,26 H36 a13,13 0 0 1 0,26 H8"/>',
}
WORD = "AIWARSS"
TAGLINE = "RAG · GUARDRAILS · EVALS"
MONO = "'JetBrains Mono','SFMono-Regular',Consolas,monospace"

# --- color themes ---------------------------------------------------------
THEMES = {
    "dark":  dict(bg="#0B0B0E", tile="#17181D", edge="#2A2C34", ink="#E9EBF0",
                  accent="#FF4D4D", knock="#0B0B0E", tag="#7A7D88"),
    "light": dict(bg="#F4F5F7", tile="#FFFFFF", edge="#DFE2E8", ink="#15171C",
                  accent="#FF4D4D", knock="#FFFFFF", tag="#6B6F7A"),
    "black": dict(bg=None, tile=None, edge="#000000", ink="#000000",
                  accent="#000000", knock="#FFFFFF", tag="#000000"),
    "white": dict(bg=None, tile=None, edge="#FFFFFF", ink="#FFFFFF",
                  accent="#FFFFFF", knock="#000000", tag="#FFFFFF"),
}


def tiles(t, size, gap, x0, y0, word=WORD):
    """One row of letter tiles."""
    out = []
    for i, ch in enumerate(word):
        x = x0 + i * (size + gap)
        last = i == len(word) - 1
        scale = size / 66
        fill = t["accent"] if last else (t["tile"] or "none")
        edge = t["accent"] if last else t["edge"]
        ink = t["knock"] if last else t["ink"]
        out.append(
            f'  <g>\n'
            f'    <rect x="{x:g}" y="{y0:g}" width="{size:g}" height="{size:g}" '
            f'rx="{14 * scale:g}" fill="{fill}" stroke="{edge}" stroke-width="{2 * scale:g}"/>\n'
            f'    <g transform="translate({x + 5 * scale:g} {y0 + 2 * scale:g}) scale({scale:g})" '
            f'fill="none" stroke="{ink}" stroke-width="7" stroke-linecap="round" '
            f'stroke-linejoin="round">{GLYPH[ch]}</g>\n'
            f'  </g>'
        )
    return "\n".join(out)


def lockup(theme, bg=True, tagline=True, size=66, gap=10, pad=42):
    t = THEMES[theme]
    w = len(WORD) * size + (len(WORD) - 1) * gap + pad * 2
    h = size + pad * 2 + (46 if tagline else 0)
    y0 = pad
    parts = []
    if bg and t["bg"]:
        parts.append(f'  <rect width="{w:g}" height="{h:g}" rx="24" fill="{t["bg"]}"/>')
    parts.append(tiles(t, size, gap, pad, y0))
    if tagline:
        parts.append(
            f'  <text x="{w / 2:g}" y="{y0 + size + 36:g}" text-anchor="middle" '
            f'font-family="{MONO}" font-size="14" letter-spacing="5" '
            f'fill="{t["tag"]}">{TAGLINE}</text>'
        )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" '
        f'width="{w:g}" height="{h:g}" role="img" aria-label="AI Warss">\n'
        + "\n".join(parts) + "\n</svg>\n"
    )


def icon(theme, box=512, rounded=True, weight=7):
    """Square app icon / favicon: the accent S tile on its own.

    `weight` is the stroke width in glyph units; small sizes need a heavier
    stroke or the S disappears at favicon scale.
    """
    t = THEMES[theme]
    pad = box * 0.08
    size = box - pad * 2
    scale = size / 66
    radius = (box * 0.22) if rounded else 0
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" '
        f'width="{box}" height="{box}" role="img" aria-label="AI Warss">\n'
        f'  <rect width="{box}" height="{box}" rx="{radius:g}" fill="{t["accent"]}"/>\n'
        f'  <g transform="translate({pad + 5 * scale:g} {pad + 2 * scale:g}) scale({scale:g})" '
        f'fill="none" stroke="{t["knock"]}" stroke-width="{weight}" stroke-linecap="round" '
        f'stroke-linejoin="round">{GLYPH["S"]}</g>\n'
        f'</svg>\n'
    )


def write(name, text):
    path = os.path.join(OUT, name)
    with open(path, "w") as fh:
        fh.write(text)
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    files = []
    for theme in ("dark", "light"):
        files += [
            write(f"ai-warss-{theme}.svg", lockup(theme)),
            write(f"ai-warss-{theme}-transparent.svg", lockup(theme, bg=False)),
            write(f"ai-warss-{theme}-header.svg", lockup(theme, bg=False, tagline=False, size=48, gap=8, pad=16)),
        ]
    for theme in ("black", "white"):
        files += [
            write(f"ai-warss-mono-{theme}.svg", lockup(theme, bg=False)),
            write(f"ai-warss-mono-{theme}-header.svg", lockup(theme, bg=False, tagline=False, size=48, gap=8, pad=16)),
        ]
    files += [
        write("ai-warss-icon.svg", icon("dark")),
        write("ai-warss-icon-square.svg", icon("dark", rounded=False)),
        write("ai-warss-favicon.svg", icon("dark", box=64, weight=10)),
    ]
    for f in files:
        print(f)


if __name__ == "__main__":
    main()
