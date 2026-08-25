#!/usr/bin/env bash

# 安裝案神本機即時收音環境。
# 用法：bash scripts/setup-realtime-voice.sh
# 檢查而不安裝：bash scripts/setup-realtime-voice.sh --check-only

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="$ROOT_DIR/tools/realtime-voice"
VENV_DIR="$VOICE_DIR/venv"
INSTALL_SYSTEM_DEPS="false"
CHECK_ONLY="false"

for arg in "$@"; do
  case "$arg" in
    --with-system-deps) INSTALL_SYSTEM_DEPS="true" ;;
    --check-only) CHECK_ONLY="true" ;;
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

if [[ "$CHECK_ONLY" == "true" ]]; then
  command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg: MISSING"; exit 1; }
  [[ -x "$VENV_DIR/bin/python" || -x "$VENV_DIR/Scripts/python.exe" ]] || { echo "venv: MISSING"; exit 1; }
  echo "runtime prerequisites: PASS"
  exit 0
fi

echo "[1/4] 建立本機 Python 環境：$VENV_DIR"
"$PYTHON" -m venv "$VENV_DIR"
if [[ -x "$VENV_DIR/bin/python" ]]; then
  VENV_PYTHON="$VENV_DIR/bin/python"
else
  VENV_PYTHON="$VENV_DIR/Scripts/python.exe"
fi
"$VENV_PYTHON" -m pip install --upgrade pip

echo "[2/4] 安裝語音辨識與本機服務依賴"
"$VENV_PYTHON" -m pip install -r "$VOICE_DIR/requirements.txt"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[3/4] 自動安裝 ffmpeg"
  case "$(uname -s)" in
    Darwin)
      command -v brew >/dev/null 2>&1 || { echo "找不到 Homebrew，無法自動安裝 ffmpeg。請先安裝 Homebrew。" >&2; exit 1; }
      brew install ffmpeg
      ;;
    Linux)
      if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update
        sudo apt-get install -y ffmpeg
      elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y ffmpeg
      else
        echo "找不到可自動使用的 Linux 套件管理器。" >&2
        exit 1
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*)
      if command -v winget >/dev/null 2>&1; then
        winget install --accept-source-agreements --accept-package-agreements --id Gyan.FFmpeg.Shared
      elif command -v choco >/dev/null 2>&1; then
        choco install ffmpeg -y
      else
        echo "Windows 需要 winget 或 Chocolatey 才能自動安裝 ffmpeg。" >&2
        exit 1
      fi
      ;;
    *) echo "不支援的作業系統：$(uname -s)" >&2; exit 1 ;;
  esac
else
  echo "[3/4] ffmpeg：$(command -v ffmpeg)"
fi

echo "[4/4] 驗證安裝"
"$VENV_PYTHON" -c 'import aiohttp, opencc; print("Python dependencies: PASS")'
ffmpeg -version | head -n 1

echo "預下載 FunASR 語音與 speaker model（第一次需要數分鐘，之後換電腦仍需各自下載）"
"$VENV_PYTHON" - <<'PY'
from funasr import AutoModel

AutoModel(model="iic/SenseVoiceSmall", trust_remote_code=True, disable_update=True)
AutoModel(model="iic/speech_eres2netv2_sv_zh-cn_16k-common", device="cpu", disable_update=True)
print("FunASR models: PASS")
PY

cat <<EOF

安裝完成。

啟動本機收音：
  cd "$VOICE_DIR"
  venv/bin/python server.py

瀏覽器開啟：http://localhost:8420

注意：venv、聲音 profile、逐字稿只留在本機，不會同步到 Git。
EOF
