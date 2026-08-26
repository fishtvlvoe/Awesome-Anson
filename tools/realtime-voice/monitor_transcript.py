#!/usr/bin/env python3
"""舊監看器的相容入口；正式流程請直接啟動 ``advisor_cli.py``。"""

from __future__ import annotations

import argparse
from pathlib import Path

from advisor_cli import main as advisor_main


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="相容入口：轉交給獨立跑的案神 CLI 顧問。"
    )
    parser.add_argument("transcript", type=Path)
    parser.add_argument("--pause-threshold", type=float, default=3.0)
    parser.add_argument("--min-window", type=float, default=60.0)
    parser.add_argument("--max-window", type=float, default=60.0)
    parser.add_argument("--poll-interval", type=float, default=0.5)
    parser.add_argument("--agent-command")
    parser.add_argument("--agent-timeout", type=float, default=60.0)
    parser.add_argument("--server-pid", type=int)
    parser.add_argument("--once", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    session_id = args.transcript.stem
    output_dir = args.transcript.parent
    forwarded = [
        "--session-id",
        session_id,
        "--transcript",
        str(args.transcript),
        "--output-dir",
        str(output_dir),
        "--pause-threshold",
        str(args.pause_threshold),
        "--time-cap",
        str(max(args.min_window, args.max_window)),
        "--poll-interval",
        str(args.poll_interval),
        "--agent-timeout",
        str(args.agent_timeout),
    ]
    if args.agent_command:
        forwarded.extend(["--agent-command", args.agent_command])
    if args.server_pid is not None:
        forwarded.extend(["--server-pid", str(args.server_pid)])
    if args.once:
        forwarded.append("--once")
    return advisor_main(forwarded)


if __name__ == "__main__":
    raise SystemExit(main())
