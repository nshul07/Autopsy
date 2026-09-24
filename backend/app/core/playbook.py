"""Action playbook generator (F15).

Generates ordered, actionable steps based on verdict band and matched patterns.
Contributes 0 points and never alters the verdict.
"""

from __future__ import annotations

import json
from functools import lru_cache

from app.config import DATA_DIR
from app.models.schemas import PatternMatch, PlaybookStep, Verdict


@lru_cache(maxsize=1)
def _load_playbooks() -> dict:
    with (DATA_DIR / "playbook_en.json").open(encoding="utf-8") as f:
        return json.load(f).get("playbooks", {})


def get_playbook(
    verdict: Verdict,
    patterns: list[PatternMatch],
    app_label: str = "this app",
    repackaging_detected: bool = False,
) -> list[PlaybookStep]:
    playbooks = _load_playbooks()

    # Determine playbook key
    key = f"{verdict}.default"
    if verdict == "red":
        matched_ids = {p.id for p in patterns}
        if "otp_stealer" in matched_ids:
            key = "red.otp_stealer"
        elif "banking_trojan" in matched_ids:
            key = "red.banking_trojan"
        elif repackaging_detected or "repackaged_signer" in matched_ids:
            key = "red.repackaged_signer"

    raw_steps = playbooks.get(key, playbooks.get("red.default", []))
    steps: list[PlaybookStep] = []

    for item in raw_steps:
        step_key = item["step_key"]
        params_needed = item.get("params", [])
        params_dict = {}
        if "app" in params_needed:
            params_dict["app"] = app_label or "this app"

        steps.append(PlaybookStep(step_key=step_key, params=params_dict))

    return steps
