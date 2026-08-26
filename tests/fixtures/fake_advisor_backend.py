#!/usr/bin/env python3
"""Deterministic anonymous headless backend used by advisor tests."""

from __future__ import annotations

import json
import sys


def main() -> int:
    prompt = sys.stdin.read()
    if not prompt:
        return 2
    payload = {
        "client_response": ["匿名對談者說明目前狀況。"],
        "current_state": "匿名對談者已說明目前狀況。",
        "confirmed": ["目前狀況已被說明"],
        "open_questions": ["成功標準尚未確認"],
        "quote_impact": "需要先確認第一階段範圍。",
        "mental_model": "核心結果 × 可延後範圍",
        "evidence": ["匿名對談者說明目前狀況。"],
        "recommended_next_move": "確認第一階段成功標準。",
        "response_options": ["先確認第一階段成功標準。"],
        "speaker_attribution": [
            {
                "segment_id": "seg-0001",
                "role": "client",
                "confidence": 0.9,
                "reason": "文字脈絡顯示為回答",
            }
        ],
        "route": "realtime-need-capture",
    }
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
