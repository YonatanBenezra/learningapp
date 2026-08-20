#!/usr/bin/env python3
"""Build hi-translations.json from English keys. Run from apps/web root."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
EN_PATH = "/tmp/en-keys.json"
OUT_PATH = os.path.join(SCRIPTS, "hi-translations.json")

import sys

sys.path.insert(0, SCRIPTS)

with open(EN_PATH) as f:
    EN = json.load(f)

from hi_translations import HI  # noqa: E402

missing = [k for k in EN if k not in HI]
extra = [k for k in HI if k not in EN]
if missing:
    raise SystemExit(f"Missing {len(missing)} keys: {missing[:10]}...")
if extra:
    raise SystemExit(f"Extra {len(extra)} keys: {extra[:10]}...")

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(HI, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(HI)} translations to {OUT_PATH}")
