#!/usr/bin/env python3
"""Generate hi.ts, marketing-hi.ts, locale-sections-hi.ts from es templates + HI map."""
from __future__ import annotations

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
MESSAGES = os.path.join(ROOT, "src/i18n/messages")
sys.path.insert(0, SCRIPTS)

from hi_translations import HI  # noqa: E402

PREFIX_MAP = {
    "profileEs": "profile",
    "notificationsEs": "notifications",
    "playerEs": "player",
    "assessmentRunnerEs": "assessmentRunner",
    "exercisesEs": "exercises",
    "marketplaceEs": "marketplace",
    "labsEs": "labs",
    "instructorEs": "instructor",
    "adminCommonEs": "adminCommon",
    "settingsExtraEs": "settings",
    "authExtraEs": "authExtra",
    "navbarExtraEs": "navbarExtra",
    "marketingSectionsEs": "marketing",
}


def escape_ts(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def format_entry(key: str, value: str, indent: int = 2) -> str:
    pad = " " * indent
    esc = escape_ts(value)
    if len(value) > 72 or "\n" in value:
        return f"{pad}{key}:\n{pad}  '{esc}',"
    return f"{pad}{key}: '{esc}',"


def parse_const_object(text: str) -> dict[str, str]:
    keys: dict[str, str] = {}
    # multiline: key:\n  'value',
    for m in re.finditer(r"^\s+(\w+):\s*\n\s+'((?:\\'|[^'])*)',", text, re.M):
        keys[m.group(1)] = m.group(2).replace("\\'", "'")
    # single line
    for m in re.finditer(r"^\s+(\w+):\s*'((?:\\'|[^'])*)',?\s*$", text, re.M):
        if m.group(1) not in keys:
            keys[m.group(1)] = m.group(2).replace("\\'", "'")
    return keys


def render_object(name: str, prefix: str, keys: dict[str, str]) -> str:
    lines = [f"export const {name} = {{"]
    for k in keys:
        full = f"{prefix}.{k}"
        if full not in HI:
            raise KeyError(f"Missing translation: {full}")
        lines.append(format_entry(k, HI[full]))
    lines.append("} as const;")
    return "\n".join(lines)


def generate_locale_sections() -> None:
    es_text = open(os.path.join(MESSAGES, "locale-sections-es.ts"), encoding="utf-8").read()
    blocks = re.findall(
        r"export const (\w+) = (\{[\s\S]*?\}) as const;",
        es_text,
    )
    out_parts: list[str] = []
    for export_name, body in blocks:
        hi_name = export_name.replace("Es", "Hi")
        prefix = PREFIX_MAP[export_name]
        keys = parse_const_object(body)
        out_parts.append(render_object(hi_name, prefix, keys))
        out_parts.append("")
    path = os.path.join(MESSAGES, "locale-sections-hi.ts")
    open(path, "w", encoding="utf-8").write("\n".join(out_parts).rstrip() + "\n")
    print(f"Wrote {path}")


def generate_marketing_hi() -> None:
    es_text = open(os.path.join(MESSAGES, "marketing-es.ts"), encoding="utf-8").read()
    m = re.search(r"export const marketingEs = (\{[\s\S]*?\}) as const;", es_text)
    if not m:
        raise RuntimeError("marketingEs block not found")
    keys = parse_const_object(m.group(1))
    content = render_object("marketingHi", "marketing", keys)
    path = os.path.join(MESSAGES, "marketing-hi.ts")
    open(path, "w", encoding="utf-8").write(content + "\n")
    print(f"Wrote {path} ({len(keys)} keys)")


INLINE_SECTIONS = [
    "common",
    "nav",
    "auth",
    "dashboard",
    "courses",
    "subscription",
    "createCourse",
    "assessments",
    "settings",
    "profileMenu",
    "achievements",
    "admin",
]


def parse_inline_section(es_text: str, section: str) -> dict[str, str]:
    m = re.search(rf"{section}: \{{([\s\S]*?)\n  \}},", es_text)
    if not m:
        raise RuntimeError(f"Section not found: {section}")
    return parse_const_object(m.group(1))


def render_inline_section(section: str, keys: dict[str, str]) -> str:
    lines = [f"  {section}: {{"]
    settings_extra = section == "settings"
    base_keys = {k: v for k, v in keys.items() if not (settings_extra and k in {
        "account", "accountDesc", "regional", "regionalDesc", "editProfile", "email",
        "plan", "viewUpgrade", "deleting", "confirmDelete", "mutationError",
    })}
    for k in base_keys:
        full = f"{section}.{k}"
        lines.append(format_entry(k, HI[full], 4))
    if settings_extra:
        lines.append("    ...settingsExtraHi,")
    lines.append("  },")
    return "\n".join(lines)


def generate_hi_ts() -> None:
    es_text = open(os.path.join(MESSAGES, "es.ts"), encoding="utf-8").read()
    sections_out = []
    for sec in INLINE_SECTIONS:
        keys = parse_inline_section(es_text, sec)
        sections_out.append(render_inline_section(sec, keys))

    content = f"""import {{ marketingHi }} from './marketing-hi';
import {{
  profileHi,
  notificationsHi,
  playerHi,
  assessmentRunnerHi,
  exercisesHi,
  marketplaceHi,
  labsHi,
  instructorHi,
  adminCommonHi,
  settingsExtraHi,
  authExtraHi,
  navbarExtraHi,
  marketingSectionsHi,
}} from './locale-sections-hi';

export const messages = {{
{chr(10).join(sections_out)}
  instructor: {{
    ...instructorHi,
  }},
  profile: profileHi,
  notifications: notificationsHi,
  player: playerHi,
  assessmentRunner: assessmentRunnerHi,
  exercises: exercisesHi,
  marketplace: marketplaceHi,
  labs: labsHi,
  adminCommon: adminCommonHi,
  authExtra: authExtraHi,
  navbarExtra: navbarExtraHi,
  marketing: {{ ...marketingHi, ...marketingSectionsHi }},
}} as const;
"""
    path = os.path.join(MESSAGES, "hi.ts")
    open(path, "w", encoding="utf-8").write(content)
    print(f"Wrote {path}")


def main() -> None:
    with open("/tmp/en-keys.json", encoding="utf-8") as f:
        en_keys = set(json.load(f))
    hi_keys = set(HI)
    missing = sorted(en_keys - hi_keys)
    extra = sorted(hi_keys - en_keys)
    if missing:
        raise SystemExit(f"Missing {len(missing)} keys, e.g. {missing[:5]}")
    if extra:
        raise SystemExit(f"Extra {len(extra)} keys, e.g. {extra[:5]}")
    print(f"HI map: {len(HI)} keys OK")
    generate_marketing_hi()
    generate_locale_sections()
    generate_hi_ts()


if __name__ == "__main__":
    main()
