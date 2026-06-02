import json
import os
import re
from typing import Dict, List

_MAPPINGS: List[Dict] = []


def _load_mappings():
    global _MAPPINGS
    if _MAPPINGS:
        return
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "mitre_mappings.json")
    with open(data_path, "r", encoding="utf-8") as f:
        _MAPPINGS = json.load(f)


def map_techniques(text: str) -> List[Dict]:
    _load_mappings()
    text_lower = text.lower()

    results = []
    for technique in _MAPPINGS:
        score = 0
        matched = []
        for kw_entry in technique.get("keywords", []):
            word = kw_entry["word"].lower()
            weight = kw_entry["weight"]
            # Use word boundary awareness
            if re.search(r"\b" + re.escape(word) + r"\b", text_lower):
                score += weight
                matched.append(word)
            elif word in text_lower:
                score += max(1, weight - 1)
                matched.append(word)

        if score == 0:
            continue

        if score >= 5:
            confidence = "High"
        elif score >= 3:
            confidence = "Medium"
        else:
            confidence = "Low"

        results.append({
            "technique_id": technique["id"],
            "technique_name": technique["name"],
            "tactic": technique["tactic"],
            "tactic_id": technique["tactic_id"],
            "confidence": confidence,
            "description": technique.get("description", ""),
            "matched_keywords": matched[:8],
            "score": score,
        })

    # Sort: High → Medium → Low, then by score desc
    order = {"High": 0, "Medium": 1, "Low": 2}
    results.sort(key=lambda x: (order[x["confidence"]], -x["score"]))

    # Return top 20 most relevant
    return results[:20]
