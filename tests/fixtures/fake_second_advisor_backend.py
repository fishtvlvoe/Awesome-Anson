#!/usr/bin/env python3
"""Anonymous second-pass backend fixture for state accumulation."""

from __future__ import annotations

import json
import sys


def main() -> int:
    prompt = sys.stdin.read()
    if not prompt:
        return 2
    assert "confirmed_facts" in prompt
    print(
        json.dumps(
            {
                "client_response": ["匿名對談者補充維護需求。"],
                "current_state": "匿名對談者補充維護需求。",
                "confirmed": ["維護方式需要再確認"],
                "open_questions": ["維護責任尚未確認"],
                "quote_impact": "報價需要列出維護責任。",
                "mental_model": "承諾訊號 × 下一步準備度",
                "evidence": ["匿名對談者補充維護需求。"],
                "recommended_next_move": "確認維護責任。",
                "response_options": ["先確認維護責任由誰負責。"],
                "speaker_attribution": [
                    {
                        "segment_id": "seg-0002",
                        "role": "client",
                        "confidence": 0.9,
                        "reason": "文字脈絡顯示為補充回答",
                    }
                ],
                "route": "quote",
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
