"""即時語音接案神：本機收音介面 + FunASR 辨識 + 簡轉繁 + 寫入案神可讀的逐字稿檔案。

啟動：venv/bin/python server.py
關閉：終端機按 Ctrl+C（SIGINT）。這個服務不背景常駐，不註冊任何開機自動啟動機制。
"""

import asyncio
import datetime
import json
import re
import socket
import subprocess
import sys
import tempfile
from pathlib import Path

from aiohttp import web

PORT = 8420
STATIC_DIR = Path(__file__).parent / "static"
OUTPUT_DIR = Path(__file__).parent / "output"
LOW_CONFIDENCE_MARK = "[聽不清楚]"
SESSION_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")


def load_model():
    """載入 FunASR SenseVoiceSmall 模型；失敗就印出真正原因並結束進程，不啟動一個沒有辨識能力的伺服器。"""
    try:
        from funasr import AutoModel
    except ImportError as exc:
        print(f"[啟動失敗] 找不到 funasr 套件，請先執行 pip install -r requirements.txt：{exc}", file=sys.stderr)
        sys.exit(1)

    try:
        model = AutoModel(model="iic/SenseVoiceSmall", trust_remote_code=True, disable_update=True)
    except Exception as exc:  # noqa: BLE001 - 啟動期的模型載入錯誤要完整浮現給使用者看
        print(f"[啟動失敗] SenseVoiceSmall 模型載入失敗，無法提供語音辨識：{exc}", file=sys.stderr)
        sys.exit(1)
    return model


def load_converter():
    from opencc import OpenCC

    return OpenCC("s2twp")


def get_lan_ip() -> str:
    """取得區域網路 IP，讓手機瀏覽器可以連到同一個服務。"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def webm_bytes_to_wav_path(webm_bytes: bytes) -> str:
    """瀏覽器送來的是 webm/opus 音訊，FunASR 吃得懂的是 wav。用本機已有的 ffmpeg 轉檔，不重造輪子。"""
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as src:
        src.write(webm_bytes)
        src_path = src.name
    wav_path = src_path.replace(".webm", ".wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", src_path, "-ar", "16000", "-ac", "1", wav_path],
        capture_output=True,
        check=True,
    )
    return wav_path


def transcribe_segment(model, converter, webm_bytes: bytes) -> str:
    """把一段音訊轉成繁體文字。音訊太短/太安靜/辨識信心太低時標記 [聽不清楚]，不能靜默丟棄或亂猜。"""
    if len(webm_bytes) < 2000:
        return LOW_CONFIDENCE_MARK

    wav_path = webm_bytes_to_wav_path(webm_bytes)
    try:
        result = model.generate(input=wav_path, language="zh", use_itn=True)
    finally:
        Path(wav_path).unlink(missing_ok=True)

    if not result:
        return LOW_CONFIDENCE_MARK

    raw_text = result[0].get("text", "")
    # SenseVoice 輸出帶著 <|zh|><|NEUTRAL|><|Speech|><|withitn|> 這類標記，取最後一段真正的文字內容
    text = raw_text.split("|>")[-1].strip()
    if not text:
        return LOW_CONFIDENCE_MARK

    return converter.convert(text)


def session_output_path(session_id: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR / f"{session_id}.md"


def append_transcript_line(session_id: str, text: str) -> None:
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    line = f"- [{ts}] {text}\n"
    with open(session_output_path(session_id), "a", encoding="utf-8") as f:
        f.write(line)


async def handle_index(request: web.Request) -> web.Response:
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    html = html.replace("__REALTIME_SESSION_ID__", request.app["session_id"])
    return web.Response(
        text=html,
        content_type="text/html",
        headers={"Cache-Control": "no-store"},
    )


def analysis_output_path(session_id: str) -> Path | None:
    """Resolve a session analysis file without allowing path traversal."""
    if not SESSION_ID_RE.fullmatch(session_id):
        return None
    return OUTPUT_DIR / f"{session_id}.analysis.json"


async def handle_analysis(request: web.Request) -> web.Response:
    """Return the latest agent analysis, or an explicit non-error status."""
    output_path = analysis_output_path(request.match_info["session_id"])
    if output_path is None:
        return web.json_response({"status": "invalid_session_id"}, status=400)
    if not output_path.exists():
        return web.json_response({"status": "not_yet_analyzed"})

    try:
        payload = json.loads(output_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return web.json_response({"status": "analysis_error"})
    if not isinstance(payload, dict):
        return web.json_response({"status": "analysis_error"})
    return web.json_response(payload)


async def handle_stream(request: web.Request) -> web.WebSocketResponse:
    ws = web.WebSocketResponse(max_msg_size=20 * 1024 * 1024)
    await ws.prepare(request)

    model = request.app["model"]
    converter = request.app["converter"]
    session_id = request.app["session_id"]

    async for msg in ws:
        if msg.type == web.WSMsgType.BINARY:
            text = await asyncio.to_thread(transcribe_segment, model, converter, msg.data)
            append_transcript_line(session_id, text)
            await ws.send_json({
                "text": text,
                "ts": datetime.datetime.now().isoformat(timespec="seconds"),
                "speaker_id": "unknown",
                "role": "pending",
                "confidence": 0.0,
                "identity_status": "pending",
            })
        elif msg.type == web.WSMsgType.ERROR:
            print(f"[stream 連線錯誤] {ws.exception()}", file=sys.stderr)

    return ws


def build_app(model, converter, session_id: str) -> web.Application:
    app = web.Application()
    app["model"] = model
    app["converter"] = converter
    app["session_id"] = session_id
    app.router.add_get("/", handle_index)
    app.router.add_get("/stream", handle_stream)
    app.router.add_get("/analysis/{session_id}", handle_analysis)
    app.router.add_static("/static/", STATIC_DIR)
    return app


def main() -> None:
    sys.stdout.reconfigure(line_buffering=True)
    model = load_model()
    converter = load_converter()

    session_id = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    lan_ip = get_lan_ip()

    print("即時語音接案神啟動完成")
    print(f"  電腦本機：http://localhost:{PORT}")
    print(f"  區網位址（僅供參考，手機瀏覽器不支援）：http://{lan_ip}:{PORT}")
    print("  手機瀏覽器對非 localhost 的 http 來源會擋麥克風權限，這個服務目前只支援電腦本機收音")
    print(f"  逐字稿輸出：{session_output_path(session_id)}")
    print("  按 Ctrl+C 關閉服務（不會背景常駐）")

    app = build_app(model, converter, session_id)
    web.run_app(app, host="0.0.0.0", port=PORT, print=None)


if __name__ == "__main__":
    main()
