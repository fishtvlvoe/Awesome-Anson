#!/usr/bin/env python3
"""Focused, anonymous checks for the realtime CLI advisor contract."""

from __future__ import annotations

import json
import sys
import tempfile
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "realtime-voice"))

from advisor_cli import (  # noqa: E402
    AnalysisCoordinator,
    TranscriptEntry,
    apply_analysis_to_state,
    initial_session_state,
    infer_text_role,
    infer_roles,
    normalize_for_display,
    parse_advisor_output,
    read_entries,
    trigger_reason,
)


def analysis_payload(options: list[str], *, client: bool = True) -> dict[str, object]:
    return {
        "client_response": ["對，先這樣就好。"] if client else ["客戶尚未回應"],
        "current_state": "目前狀況已整理。",
        "confirmed": ["先整理提醒流程"] if client else [],
        "open_questions": ["成功標準尚未確認"],
        "quote_impact": "先收斂第一階段範圍。",
        "mental_model": "核心結果 × 可延後範圍",
        "evidence": ["先把提醒整理好。"],
        "recommended_next_move": "確認第一階段成功標準。",
        "response_options": options,
        "speaker_attribution": [
            {
                "segment_id": "seg-0001",
                "role": "client" if client else "pm",
                "confidence": 0.9,
                "reason": "文字脈絡",
            }
        ],
        "route": "realtime-need-capture",
    }


def test_parse_options() -> None:
    for count in (1, 2, 3):
        payload = analysis_payload([f"回應 {index}" for index in range(count)])
        assert len(parse_advisor_output(json.dumps(payload))["response_options"]) == count
    for bad in ([], ["一", "二", "三", "四"]):
        try:
            parse_advisor_output(json.dumps(analysis_payload(bad)))
        except ValueError:
            pass
        else:
            raise AssertionError("invalid response option count must fail")
    assert parse_advisor_output(json.dumps(analysis_payload([], client=False)))["response_options"] == []


def test_role_inference_is_textual_and_uncertain() -> None:
    assert infer_text_role("請問你們目前最想改善哪一段？").role == "pm"
    assert infer_text_role("我們常常漏掉回訪，想先把提醒整理好。").role == "client"
    uncertain = infer_text_role("嗯，這段還需要再確認。")
    assert uncertain.role == "unknown"
    assert 0 <= uncertain.confidence <= 1
    assert uncertain.reason


def test_trigger_pause_and_time_cap() -> None:
    start = datetime(2026, 8, 26, 9, 0, tzinfo=timezone.utc)
    one = TranscriptEntry("seg-0001", start, "第一段")
    assert trigger_reason([one], start + timedelta(seconds=3.1), 3.0, 60.0) == "pause"
    entries = [
        TranscriptEntry(f"seg-{index:04d}", start + timedelta(seconds=index), f"第 {index} 段")
        for index in range(61)
    ]
    assert trigger_reason(entries, start + timedelta(seconds=60), 3.0, 60.0) == "time_cap"


def test_inflight_analysis_queues_new_content() -> None:
    release = threading.Event()
    calls: list[list[str]] = []

    def delayed(batch: list[TranscriptEntry]) -> dict[str, object]:
        calls.append([entry.text for entry in batch])
        release.wait(timeout=2)
        return analysis_payload(["先確認成功標準"])

    start = datetime.now(timezone.utc)
    first = [TranscriptEntry("seg-0001", start, "客戶先說明目前狀況")]
    coordinator = AnalysisCoordinator(delayed, pause_threshold=0.01, time_cap=60)
    try:
        events = coordinator.poll(first, start + timedelta(seconds=1))
        assert [event.kind for event in events] == ["trigger"]
        queued = first + [TranscriptEntry("seg-0002", start + timedelta(seconds=1), "還有一個限制")]
        assert coordinator.poll(queued, start + timedelta(seconds=1.1)) == []
        assert calls == [["客戶先說明目前狀況"]]
        release.set()
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline and not coordinator.future_done:
            coordinator.poll(queued, start + timedelta(seconds=2))
            time.sleep(0.01)
        events = coordinator.poll(queued, start + timedelta(seconds=5))
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline and (len(calls) < 2 or not coordinator.future_done):
            coordinator.poll(queued, start + timedelta(seconds=5))
            time.sleep(0.01)
        assert coordinator.future_done
        assert calls == [["客戶先說明目前狀況"], ["還有一個限制"]]
        assert any(event.kind == "completed" for event in events) or coordinator.last_result is not None
    finally:
        coordinator.close()


def test_session_state_round_trip() -> None:
    with tempfile.TemporaryDirectory() as temporary:
        transcript = Path(temporary) / "fixture.md"
        transcript.write_text(
            "- [2026-08-26T09:00:00+00:00] 請問目前狀況？\n",
            encoding="utf-8",
        )
        assert read_entries(transcript)[0].segment_id == "seg-0001"


def test_confirmed_facts_accumulate() -> None:
    state = initial_session_state("accumulation-fixture")
    first = analysis_payload(["先確認第一階段"], client=True)
    second = analysis_payload(["再確認維護方式"], client=True)
    state = apply_analysis_to_state(state, first)
    state = apply_analysis_to_state(state, {**second, "confirmed": ["維護方式"]})
    assert state["confirmed_facts"] == ["先整理提醒流程", "維護方式"]
    assert state["pending_response_options"] == ["再確認維護方式"]


def test_operator_role_is_fixed_and_unknown_is_not_confirmed() -> None:
    state = initial_session_state("role-fixture")
    assert state["operator_role"] == "pm"
    unknown_result = analysis_payload(["不應顯示"], client=True)
    unknown_result["speaker_attribution"] = [
        {
            "segment_id": "seg-0005",
            "role": "unknown",
            "confidence": 0.4,
            "reason": "文字不足",
        }
    ]
    normalized = normalize_for_display(unknown_result)
    assert normalized["confirmed"] == []
    assert normalized["response_options"] == []


def test_fixture_has_pm_client_and_unknown_roles() -> None:
    fixture = Path(__file__).parent / "fixtures" / "realtime-cli-advisor-anonymous.md"
    entries = read_entries(fixture)
    roles = [item["role"] for item in infer_roles(entries)]
    assert "pm" in roles
    assert "client" in roles
    assert "unknown" in roles


if __name__ == "__main__":
    tests = [value for name, value in globals().items() if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
    print(f"ok ({len(tests)} tests)")
