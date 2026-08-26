#!/usr/bin/env python3
"""Anonymous backend fixture for the PM-only, no-client-response case."""

from __future__ import annotations

import json
import sys


def main() -> int:
    if not sys.stdin.read():
        return 2
    print(
        json.dumps(
            {
                "client_response": ["客戶尚未回應"],
                "current_state": "目前只有 PM 說明。",
                "confirmed": [],
                "open_questions": ["等待客戶回應"],
                "quote_impact": "尚未取得客戶範圍承諾。",
                "mental_model": "回應準備度",
                "evidence": ["目前只有 PM 說明。"],
                "recommended_next_move": "先等待客戶回答。",
                "response_options": [],
                "speaker_attribution": [
                    {
                        "segment_id": "seg-0001",
                        "role": "pm",
                        "confidence": 0.9,
                        "reason": "文字脈絡顯示為方案說明",
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
