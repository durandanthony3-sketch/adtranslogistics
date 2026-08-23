#!/usr/bin/env python3
"""Generate public, anonymised SAD profiles from the global 2026 audit.

Only observations reproduced by the normal A-D liquidation engine (within five
francs, which covers per-line rounding) are published. Declaration numbers,
VINs, importers and other dossier identifiers never leave the audit report.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


DEFAULT_AUDIT = Path(__file__).resolve().parents[2] / "audit-global-2026.json"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "sad_2026_profiles.js"


MODEL_ALIASES = {
    "RAV 4": "RAV4",
    "RAV44": "RAV4",
    "RX 350": "RX",
    "GLC300": "GLC",
    "BENZ GLC300": "GLC",
    "GLK 350": "GLK",
    "ML350": "ML",
    "ML 350": "ML",
    "5": "MAZDA 5",
    "PRADO": "LAND CRUISER PRADO",
    "COROLLA VERSO": "VERSO",
}


def normalise(value: object) -> str:
    text = unicodedata.normalize("NFD", str(value or "").upper())
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r"[-_]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def profile_key(brand: str, label: str, year: str) -> str:
    model = MODEL_ALIASES.get(normalise(label), normalise(label))
    return f"{normalise(brand)}|{model.replace(' ', '')}|{year}"


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def xof(value: int) -> str:
    return f"{value:,}".replace(",", " ")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", type=Path, default=DEFAULT_AUDIT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    audit = json.loads(args.audit.read_text(encoding="utf-8"))
    grouped: dict[str, list[dict]] = defaultdict(list)

    for raw_key, records in audit["profiles"].items():
        brand, _model_key, year = raw_key.rsplit("|", 2)
        for record in records:
            if record["maxDelta"] > 5:
                continue
            key = profile_key(brand, record["label"], year)
            item = dict(record)
            item["brand"] = normalise(brand)
            item["year"] = int(year)
            grouped[key].append(item)

    public_profiles = {}
    accepted_observations = 0
    accepted_vehicle_years = 0
    for key, records in sorted(grouped.items()):
        # Merge exact duplicates that arrived through equivalent catalogue keys.
        merged = {}
        for record in records:
            # SYDONIA exports can differ by a few francs on the CAF while the
            # final liquidation is identical. Collapse those display-only
            # rounding variants into one public profile.
            near = next(
                (
                    signature
                    for signature in merged
                    if signature[1] == record["taxes"]
                    and signature[2] == record["category"]
                    and abs(signature[0] - record["caf"]) <= 5
                ),
                None,
            )
            signature = near or (record["caf"], record["taxes"], record["category"])
            current = merged.setdefault(
                signature,
                {
                    "caf": record["caf"],
                    "taxes": record["taxes"],
                    "category": record["category"],
                    "count": 0,
                    "origins": Counter(),
                },
            )
            current["count"] += record["count"]
            current["origins"].update(record["origins"])
            current["caf"] = max(current["caf"], record["caf"])

        observations = sorted(
            merged.values(), key=lambda item: (item["taxes"], item["caf"]), reverse=True
        )
        profiles = []
        for position, record in enumerate(observations, start=1):
            zone = record["origins"].most_common(1)[0][0] if record["origins"] else "europe"
            count = record["count"]
            prefix = "Profil prudent — " if position == 1 and len(observations) > 1 else ""
            profile_id = f"sad2026-{slug(key)}-{position}"
            profiles.append(
                {
                    "id": profile_id,
                    "label": (
                        f"{prefix}CAF {xof(record['caf'])} XOF · "
                        f"liquidation {xof(record['taxes'])} XOF"
                    ),
                    "cat": record["category"],
                    "zone": zone,
                    "observedCount": count,
                    "useOfficialCaf": True,
                    "officialCaf": record["caf"],
                    "officialTaxes": record["taxes"],
                    "evidence": (
                        f"{count} liquidation{'s' if count > 1 else ''} payée"
                        f"{'s' if count > 1 else ''} observée{'s' if count > 1 else ''} en 2026 · "
                        f"CAF {xof(record['caf'])} XOF · droits et taxes {xof(record['taxes'])} XOF"
                    ),
                }
            )
            accepted_observations += count

        if not profiles:
            continue
        accepted_vehicle_years += 1
        count = sum(profile["observedCount"] for profile in profiles)
        public_profiles[key] = {
            "defaultId": profiles[0]["id"],
            "note": (
                f"{count} liquidation{'s' if count > 1 else ''} payée"
                f"{'s' if count > 1 else ''} observée{'s' if count > 1 else ''} en 2026. "
                "Le niveau le plus élevé est présélectionné par prudence ; confirmez le VIN, "
                "la cylindrée et l’AVD avant embarquement."
            ),
            "profiles": profiles,
        }

    meta = {
        "sheet": "2026",
        "acceptedObservations": accepted_observations,
        "vehicleYearProfiles": accepted_vehicle_years,
        "formulaToleranceXof": 5,
        "excludedSpecialCases": audit["vehicleRowsMatched"] - accepted_observations,
        "sourceLabel": "Liquidations payées 2026, anonymisées",
    }
    payload = (
        "// Profils SAD 2026 anonymisés — générés par tools/generate_sad_2026_profiles.py\n"
        "window.SAD_2026_META = "
        + json.dumps(meta, ensure_ascii=False, separators=(",", ":"))
        + ";\nwindow.SAD_2026_PROFILES = "
        + json.dumps(public_profiles, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    args.output.write_text(payload, encoding="utf-8")
    print(json.dumps(meta, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
