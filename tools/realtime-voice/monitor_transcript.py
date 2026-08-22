#!/usr/bin/env python3
"""Monitor transcript timestamps and report pause-trigger events.

This process deliberately watches only the transcript file.  Browser audio/VAD
logic stays in ``static/index.html`` and is not imported or inspected here.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path


TRANSCRIPT_LINE_RE = re.compile(
    r"^\s*-\s*\[(?P<timestamp>[^\]]+)\]\s*(?P<text>.*)$"
)


@dataclass(frozen=True)
class TranscriptEntry:
    timestamp: dt.datetime
    text: str


def parse_timestamp(value: str) -> dt.datetime:
    """Parse the ISO-8601 timestamps written by ``server.py``."""
    normalized = value.strip().replace("Z", "+00:00")
    parsed = dt.datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def read_entries(transcript_path: Path) -> list[TranscriptEntry]:
    """Read valid timestamped transcript lines; ignore incomplete writes."""
    try:
        lines = transcript_path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return []

    entries: list[TranscriptEntry] = []
    for line in lines:
        match = TRANSCRIPT_LINE_RE.match(line)
        if not match:
            continue
        try:
            timestamp = parse_timestamp(match.group("timestamp"))
        except ValueError:
            continue
        entries.append(TranscriptEntry(timestamp, match.group("text")))
    return entries


def now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def report_pause_trigger(
    transcript_path: Path,
    pending_entries: list[TranscriptEntry],
    idle_seconds: float,
) -> None:
    last_entry = pending_entries[-1]
    print(
        "[trigger] reason=pause "
        f"idle_seconds={idle_seconds:.1f} "
        f"new_lines={len(pending_entries)} "
        f"analyzed_through_ts={last_entry.timestamp.isoformat()} "
        f"transcript={transcript_path}",
        flush=True,
    )


def monitor(transcript_path: Path, pause_threshold: float, poll_interval: float) -> None:
    """Poll the transcript until a pause follows newly appended content."""
    cursor = len(read_entries(transcript_path))
    print(
        f"[monitor] watching={transcript_path} "
        f"pause_threshold={pause_threshold:.1f}s",
        flush=True,
    )

    try:
        while True:
            entries = read_entries(transcript_path)
            if len(entries) < cursor:
                # The recording session was reset/truncated.  Start at its new
                # beginning instead of treating old content as new content.
                cursor = len(entries)

            pending_entries = entries[cursor:]
            if pending_entries:
                idle_seconds = (
                    now_utc() - pending_entries[-1].timestamp
                ).total_seconds()
                if idle_seconds > pause_threshold:
                    report_pause_trigger(
                        transcript_path, pending_entries, idle_seconds
                    )
                    cursor = len(entries)

            time.sleep(poll_interval)
    except KeyboardInterrupt:
        print("[monitor] stopped", flush=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Monitor transcript timestamps for a pause trigger."
    )
    parser.add_argument("transcript", type=Path, help="transcript .md path")
    parser.add_argument(
        "--pause-threshold",
        type=float,
        default=3.0,
        help="seconds without a new timestamp before triggering (default: 3)",
    )
    parser.add_argument(
        "--poll-interval",
        type=float,
        default=0.5,
        help="seconds between transcript reads (default: 0.5)",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.pause_threshold <= 0:
        print("--pause-threshold must be greater than 0", file=sys.stderr)
        return 2
    if args.poll_interval <= 0:
        print("--poll-interval must be greater than 0", file=sys.stderr)
        return 2
    monitor(args.transcript, args.pause_threshold, args.poll_interval)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
