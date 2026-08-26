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
SESSION_ID="$(date -u +%Y%m%d-%H%M%S)-$$"
OUTPUT_DIR="${REALTIME_ADVISOR_OUTPUT_DIR:-$VOICE_DIR/output}"
SERVER_PID=""
ADVISOR_PID=""
exec 3<&0

open_browser() {
  local url="$SERVICE_URL/"
  case "$(uname -s)" in
    Darwin) open "$url" ;;
    Linux) command -v xdg-open >/dev/null 2>&1 && xdg-open "$url" >/dev/null 2>&1 & ;;
    MINGW*|MSYS*|CYGWIN*) start "" "$url" ;;
  esac
}

if [[ -f "$VOICE_DIR/certs/cert.pem" && -f "$VOICE_DIR/certs/key.pem" ]]; then
  SCHEME="https"
  CURL_SCHEME_ARGS=(--insecure)
else
  SCHEME="http"
  CURL_SCHEME_ARGS=()
fi
SERVICE_URL="${SCHEME}://localhost:8420"

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:8420 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "[案神] 啟動失敗：錄音 server port 8420 已被其他程序占用" >&2
  exit 1
fi

"$PYTHON" server.py --session-id "$SESSION_ID" --output-dir "$OUTPUT_DIR" &
SERVER_PID=$!
"$PYTHON" advisor_cli.py --session-id "$SESSION_ID" --output-dir "$OUTPUT_DIR" --server-pid "$SERVER_PID" <&3 &
ADVISOR_PID=$!

cleanup() {
  exit_code=$?
  trap - EXIT INT TERM
  if [[ -n "$ADVISOR_PID" ]]; then
    kill "$ADVISOR_PID" 2>/dev/null || true
  fi
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "$ADVISOR_PID" ]]; then
    wait "$ADVISOR_PID" 2>/dev/null || true
  fi
  if [[ -n "$SERVER_PID" ]]; then
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

process_running() {
  local pid="$1"
  local process_state
  kill -0 "$pid" 2>/dev/null || return 1
  process_state="$(ps -p "$pid" -o state= 2>/dev/null | tr -d ' ' || true)"
  [[ "$process_state" != Z* ]]
}

echo "[案神] 啟動 session=$SESSION_ID"
echo "[案神] 等待錄音 server 與 CLI 顧問同時 ready"

ready="false"
for _ in {1..120}; do
  if ! process_running "$SERVER_PID"; then
    echo "[案神] 啟動失敗：錄音 server 未能啟動" >&2
    exit 1
  fi
  if ! process_running "$ADVISOR_PID"; then
    echo "[案神] 啟動失敗：CLI 顧問未能啟動" >&2
    exit 1
  fi
  if command -v curl >/dev/null 2>&1; then
    status_json="$(curl "${CURL_SCHEME_ARGS[@]}" -fsS "$SERVICE_URL/advisor-status/$SESSION_ID" 2>/dev/null || true)"
    if [[ "$status_json" == *'"connected"'*'true'* ]]; then
      ready="true"
      break
    fi
  fi
  sleep 1
done

if [[ "$ready" != "true" ]]; then
  echo "[案神] 啟動失敗：錄音 server 或 CLI 顧問未在期限內 ready" >&2
  exit 1
fi

if [[ "$OPEN_BROWSER" == "true" ]]; then
  open_browser
fi

echo "[案神] server 與 advisor 已 ready；按 q 或 Ctrl+C 一起停止"
while process_running "$SERVER_PID" && process_running "$ADVISOR_PID"; do
  sleep 0.5
done

if ! process_running "$SERVER_PID"; then
  echo "[案神] 錄音 server 已停止，正在停止 CLI 顧問" >&2
fi
if ! process_running "$ADVISOR_PID"; then
  echo "[案神] CLI 顧問已停止，正在停止錄音 server" >&2
fi
exit 0
