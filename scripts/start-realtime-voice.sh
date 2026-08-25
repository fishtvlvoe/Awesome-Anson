#!/usr/bin/env bash

set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="$ROOT_DIR/tools/realtime-voice"
OPEN_BROWSER="true"

for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_BROWSER="false" ;;
    -h|--help)
      printf '用法：bash scripts/start-realtime-voice.sh [--no-open]\n'
      exit 0
      ;;
    *) echo "未知參數：$arg" >&2; exit 2 ;;
  esac
done

if [[ -x "$VOICE_DIR/venv/bin/python" ]]; then
  PYTHON="$VOICE_DIR/venv/bin/python"
elif [[ -x "$VOICE_DIR/venv/Scripts/python.exe" ]]; then
  PYTHON="$VOICE_DIR/venv/Scripts/python.exe"
else
  echo "尚未安裝即時語音依賴，先執行：bash scripts/setup-realtime-voice.sh" >&2
  exit 1
fi

cd "$VOICE_DIR"
open_browser() {
  local url="http://localhost:8420/"
  case "$(uname -s)" in
    Darwin) open "$url" ;;
    Linux) command -v xdg-open >/dev/null 2>&1 && xdg-open "$url" >/dev/null 2>&1 & ;;
    MINGW*|MSYS*|CYGWIN*) start "" "$url" ;;
  esac
}

"$PYTHON" server.py &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

if [[ "$OPEN_BROWSER" == "true" ]]; then
  for _ in {1..120}; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      wait "$SERVER_PID"
      exit $?
    fi
    if command -v curl >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8420/static/voice-profile.html >/dev/null 2>&1; then
      open_browser
      break
    fi
    sleep 1
  done
fi

wait "$SERVER_PID"
