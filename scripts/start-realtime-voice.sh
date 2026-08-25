#!/usr/bin/env bash

set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="$ROOT_DIR/tools/realtime-voice"

if [[ -x "$VOICE_DIR/venv/bin/python" ]]; then
  PYTHON="$VOICE_DIR/venv/bin/python"
elif [[ -x "$VOICE_DIR/venv/Scripts/python.exe" ]]; then
  PYTHON="$VOICE_DIR/venv/Scripts/python.exe"
else
  echo "尚未安裝即時語音依賴，先執行：bash scripts/setup-realtime-voice.sh" >&2
  exit 1
fi

cd "$VOICE_DIR"
exec "$PYTHON" server.py
