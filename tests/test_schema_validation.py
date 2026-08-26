#!/usr/bin/env python3
"""Executable schema contract check for the realtime CLI advisor."""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "realtime-voice"))

from advisor_schema import (  # noqa: E402
    validate_analysis_output,
    validate_session_state,
)


def example_state() -> dict[str, object]:
    return {
        "session_id": "fixture-session",
        "operator_role": "pm",
        "case_ref": "case-optional",
        "confirmed_facts": [],
        "open_questions": [],
        "current_mental_model": "",
        "quote_signals": [],
        "last_analysis_ts": "",
        "pending_response_options": [],
        "adoption_events": [],
    }


def example_analysis() -> dict[str, object]:
    return {
        "client_response": ["我們想先把提醒整理好。"],
        "current_state": "客戶已說明目前最在意提醒流程。",
        "confirmed": ["先整理提醒流程"],
        "open_questions": ["成功標準尚未確認"],
        "quote_impact": "先收斂第一階段範圍。",
        "mental_model": "核心結果 × 可延後範圍",
        "evidence": ["我們現在常常漏掉回訪，想先把提醒整理好。"],
        "recommended_next_move": "確認第一階段成功標準。",
        "response_options": ["先確認提醒完成的標準。"],
        "speaker_attribution": [
            {
                "segment_id": "seg-0002",
                "role": "client",
                "confidence": 0.9,
                "reason": "以自身現況回答問題",
            }
        ],
        "route": "realtime-need-capture",
    }


def main() -> int:
    if "--state-file" in sys.argv:
        index = sys.argv.index("--state-file") + 1
        if index >= len(sys.argv):
            raise SystemExit("--state-file needs a path")
        payload = json.loads(Path(sys.argv[index]).read_text(encoding="utf-8"))
        validate_session_state(payload)
        print(json.dumps({"state_file": "valid", "confirmed_facts": payload["confirmed_facts"]}, ensure_ascii=False))
        return 0
    state = example_state()
    analysis = example_analysis()
    if "--missing-field" in sys.argv:
        del state["confirmed_facts"]
        try:
            validate_session_state(state)
        except ValueError:
            return 1
        return 0

    validate_session_state(state)
    validate_analysis_output(analysis)

    missing = copy.deepcopy(analysis)
    del missing["recommended_next_move"]
    try:
        validate_analysis_output(missing)
    except ValueError:
        pass
    else:
        raise AssertionError("missing analysis field must fail")

    print(json.dumps({"session_state": "valid", "analysis_output": "valid"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
