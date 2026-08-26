#!/usr/bin/env python3
"""Anonymous backend fixture for low-confidence role attribution."""

from __future__ import annotations

import json
import sys


def main() -> int:
    if not sys.stdin.read():
        return 2
    print(
        json.dumps(
            {
                "client_response": ["模糊句"],
                "current_state": "這段角色仍待確認。",
                "confirmed": ["模糊句"],
                "open_questions": ["這段話是誰說的尚未確認"],
                "quote_impact": "暫不據此調整報價。",
                "mental_model": "回應準備度",
                "evidence": ["模糊句"],
                "recommended_next_move": "先確認說話角色。",
                "response_options": ["先確認這段資訊的來源。"],
                "speaker_attribution": [
                    {
                        "segment_id": "seg-0001",
                        "role": "unknown",
                        "confidence": 0.4,
                        "reason": "文字不足",
                    }
                ],
                "route": "none",
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
