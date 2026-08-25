#!/usr/bin/env bash

# 安裝案神本機即時收音環境。
# 用法：bash scripts/setup-realtime-voice.sh [--with-system-deps]

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="$ROOT_DIR/tools/realtime-voice"
VENV_DIR="$VOICE_DIR/venv"
INSTALL_SYSTEM_DEPS="false"

for arg in "$@"; do
  case "$arg" in
    --with-system-deps) INSTALL_SYSTEM_DEPS="true" ;;
    -h|--help) sed -n '1,8p' "$0"; exit 0 ;;
    *) echo "未知參數：$arg" >&2; exit 2 ;;
  esac
done

if command -v python3 >/dev/null 2>&1; then
  PYTHON="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON="$(command -v python)"
else
  echo "找不到 Python 3。請先安裝 Python 3.10 以上，再重新執行。" >&2
  exit 1
fi

echo "[1/4] 建立本機 Python 環境：$VENV_DIR"
"$PYTHON" -m venv "$VENV_DIR"
"$VENV_DIR/bin/python" -m pip install --upgrade pip

echo "[2/4] 安裝語音辨識與本機服務依賴"
"$VENV_DIR/bin/pip" install -r "$VOICE_DIR/requirements.txt"

if ! command -v ffmpeg >/dev/null 2>&1; then
  if [[ "$INSTALL_SYSTEM_DEPS" == "true" && "$(uname -s)" == "Darwin" && command -v brew >/dev/null 2>&1 ]]; then
    echo "[3/4] 使用 Homebrew 安裝 ffmpeg"
    brew install ffmpeg
  else
    echo "[3/4] 找不到 ffmpeg。瀏覽器錄音需要它把 webm 轉成 wav。"
    case "$(uname -s)" in
      Darwin) echo "      macOS：brew install ffmpeg，或重跑本腳本 --with-system-deps" ;;
      Linux) echo "      Debian/Ubuntu：sudo apt-get install ffmpeg" ;;
      *) echo "      請依你的作業系統安裝 ffmpeg，並確認 ffmpeg 在 PATH。" ;;
    esac
    exit 1
  fi
else
  echo "[3/4] ffmpeg：$(command -v ffmpeg)"
fi

echo "[4/4] 驗證安裝"
"$VENV_DIR/bin/python" -c 'import aiohttp, opencc; print("Python dependencies: PASS")'
ffmpeg -version | head -n 1

cat <<EOF

安裝完成。

啟動本機收音：
  cd "$VOICE_DIR"
  venv/bin/python server.py

瀏覽器開啟：http://localhost:8420

注意：venv、聲音 profile、逐字稿只留在本機，不會同步到 Git。
EOF
