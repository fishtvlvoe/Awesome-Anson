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
import uuid
from pathlib import Path

from aiohttp import web

from voice_identity import (
    ERes2NetV2EmbeddingProvider,
    ProfileSpeakerMatcher,
    SpeakerIdentity,
    SpeakerModelError,
    VoiceProfileError,
    VoiceProfileStore,
)

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
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", src_path, "-ar", "16000", "-ac", "1", wav_path],
            capture_output=True,
            check=True,
        )
    finally:
        Path(src_path).unlink(missing_ok=True)
    return wav_path


def transcribe_segment_details(
    model, converter, webm_bytes: bytes, speaker_matcher=None
) -> tuple[str, SpeakerIdentity]:
    """把一段音訊轉成繁體文字。音訊太短/太安靜/辨識信心太低時標記 [聽不清楚]，不能靜默丟棄或亂猜。"""
    if len(webm_bytes) < 2000:
        return LOW_CONFIDENCE_MARK, SpeakerIdentity("unknown", "pending", 0.0, "pending")

    wav_path = webm_bytes_to_wav_path(webm_bytes)
    try:
        result = model.generate(input=wav_path, language="zh", use_itn=True)
        identity = (
            speaker_matcher.classify(Path(wav_path))
            if speaker_matcher is not None
            else SpeakerIdentity("unknown", "pending", 0.0, "pending")
        )
    finally:
        Path(wav_path).unlink(missing_ok=True)

    if not result:
        return LOW_CONFIDENCE_MARK, identity

    raw_text = result[0].get("text", "")
    # SenseVoice 輸出帶著 <|zh|><|NEUTRAL|><|Speech|><|withitn|> 這類標記，取最後一段真正的文字內容
    text = raw_text.split("|>")[-1].strip()
    if not text:
        return LOW_CONFIDENCE_MARK, identity

    return converter.convert(text), identity


def transcribe_segment(model, converter, webm_bytes: bytes) -> str:
    """保留舊呼叫介面，供既有測試與逐字稿 consumer 使用。"""
    return transcribe_segment_details(model, converter, webm_bytes)[0]


def session_output_path(session_id: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR / f"{session_id}.md"


def append_transcript_line(session_id: str, text: str) -> None:
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    line = f"- [{ts}] {text}\n"
    with open(session_output_path(session_id), "a", encoding="utf-8") as f:
        f.write(line)


def session_segments_path(session_id: str) -> Path | None:
    """Resolve structured segment metadata beside the legacy markdown transcript."""
    if not SESSION_ID_RE.fullmatch(session_id):
        return None
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR / f"{session_id}.segments.jsonl"


def append_segment_metadata(
    session_id: str,
    text: str,
    identity: SpeakerIdentity,
    *,
    timestamp: str | None = None,
) -> dict[str, object]:
    """Persist speaker metadata without changing the existing `.md` contract."""
    output_path = session_segments_path(session_id)
    if output_path is None:
        raise ValueError("invalid session id")
    existing_count = 0
    if output_path.exists():
        existing_count = len(output_path.read_text(encoding="utf-8").splitlines())
    payload = {
        "id": f"seg-{existing_count + 1:04d}",
        "text": text,
        "ts": timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        **identity.to_dict(),
    }
    with open(output_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return payload


def session_events_path(session_id: str) -> Path | None:
    if not SESSION_ID_RE.fullmatch(session_id):
        return None
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR / f"{session_id}.events.jsonl"


def append_session_event(session_id: str, event: dict[str, object]) -> None:
    """Write an auditable UI event; this endpoint never runs generation/deploy code."""
    output_path = session_events_path(session_id)
    if output_path is None:
        raise ValueError("invalid session id")
    event_type = event.get("event_type")
    if event_type not in {"response_option_selected", "adoption_updated", "demo_triggered"}:
        raise ValueError("unsupported event type")
    payload = {
        "event_id": f"evt-{uuid.uuid4().hex}",
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        **event,
    }
    with open(output_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


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


async def handle_segments(request: web.Request) -> web.Response:
    """Return structured speaker segments; legacy markdown remains the source for old consumers."""
    output_path = session_segments_path(request.match_info["session_id"])
    if output_path is None:
        return web.json_response({"status": "invalid_session_id"}, status=400)
    if not output_path.exists():
        return web.json_response({"status": "not_yet_transcribed", "segments": []})

    segments = []
    try:
        for line in output_path.read_text(encoding="utf-8").splitlines():
            if line:
                payload = json.loads(line)
                if not isinstance(payload, dict):
                    raise ValueError("segment must be an object")
                segments.append(payload)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return web.json_response({"status": "segments_error", "segments": []})
    return web.json_response({"status": "ready", "segments": segments})


async def handle_events(request: web.Request) -> web.Response:
    session_id = request.match_info["session_id"]
    if session_events_path(session_id) is None:
        return web.json_response({"status": "invalid_session_id"}, status=400)
    try:
        payload = await request.json()
    except (json.JSONDecodeError, UnicodeDecodeError):
        return web.json_response({"status": "invalid_event", "message": "事件必須是 JSON"}, status=400)
    if not isinstance(payload, dict):
        return web.json_response({"status": "invalid_event", "message": "事件必須是物件"}, status=400)
    try:
        append_session_event(session_id, payload)
    except ValueError as exc:
        return web.json_response({"status": "invalid_event", "message": str(exc)}, status=400)
    return web.json_response({"status": "recorded", "event_type": payload["event_type"]}, status=201)


async def handle_voice_profile(request: web.Request) -> web.Response:
    """讀取或建立目前操作者的本機聲音 profile。"""
    store = request.app["voice_profile_store"]
    if request.method == "GET":
        try:
            profile = store.load_profile()
        except VoiceProfileError as exc:
            return web.json_response(
                {"status": "profile_error", "message": str(exc)}, status=500
            )
        if profile is None:
            return web.json_response({"status": "not_ready"})
        return web.json_response(
            {
                "status": profile["status"],
                "profile_id": profile["profile_id"],
                "created_at": profile["created_at"],
                "model": profile["model"],
                "sample_count": len(profile.get("samples", [])),
            }
        )

    sample = await request.read()
    if not sample:
        return web.json_response(
            {"status": "invalid_sample", "message": "聲音樣本是空的"}, status=400
        )
    if len(sample) > 20 * 1024 * 1024:
        return web.json_response(
            {"status": "invalid_sample", "message": "聲音樣本不可超過 20 MB"},
            status=413,
        )
    try:
        profile = store.create_profile([sample])
    except VoiceProfileError as exc:
        return web.json_response(
            {"status": "invalid_sample", "message": str(exc)}, status=400
        )
    speaker_model_status = "pending"
    speaker_model_message = "聲音樣本已保存，speaker model 尚未建立"
    wav_path = None
    try:
        provider = request.app.get("speaker_provider")
        if provider is None:
            provider = ERes2NetV2EmbeddingProvider(device="cpu")
            request.app["speaker_provider"] = provider
        wav_path = webm_bytes_to_wav_path(sample)
        embedding = await asyncio.to_thread(provider.extract, Path(wav_path))
        profile = store.set_operator_embedding(
            embedding, model_name=provider.MODEL_NAME
        )
        request.app["speaker_matcher"] = ProfileSpeakerMatcher(
            embedding, provider
        )
        speaker_model_status = "ready"
        speaker_model_message = "speaker model 已建立"
    except (SpeakerModelError, OSError, subprocess.CalledProcessError) as exc:
        print(f"[聲音身份] speaker model 尚未可用：{exc}", file=sys.stderr)
    finally:
        if wav_path:
            Path(wav_path).unlink(missing_ok=True)
    return web.json_response(
        {
            "status": profile["status"],
            "profile_id": profile["profile_id"],
            "created_at": profile["created_at"],
            "model": profile["model"],
            "sample_count": len(profile["samples"]),
            "speaker_model": speaker_model_status,
            "message": speaker_model_message,
        },
        status=201,
    )


async def handle_stream(request: web.Request) -> web.WebSocketResponse:
    ws = web.WebSocketResponse(max_msg_size=20 * 1024 * 1024)
    await ws.prepare(request)

    model = request.app["model"]
    converter = request.app["converter"]
    session_id = request.app["session_id"]

    async for msg in ws:
        if msg.type == web.WSMsgType.BINARY:
            text, identity = await asyncio.to_thread(
                transcribe_segment_details,
                model,
                converter,
                msg.data,
                request.app.get("speaker_matcher"),
            )
            append_transcript_line(session_id, text)
            timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
            append_segment_metadata(session_id, text, identity, timestamp=timestamp)
            await ws.send_json({
                "text": text,
                "ts": timestamp,
                **identity.to_dict(),
            })
        elif msg.type == web.WSMsgType.ERROR:
            print(f"[stream 連線錯誤] {ws.exception()}", file=sys.stderr)

    return ws


def build_app(model, converter, session_id: str) -> web.Application:
    app = web.Application()
    app["model"] = model
    app["converter"] = converter
    app["session_id"] = session_id
    app["voice_profile_store"] = VoiceProfileStore()
    app["speaker_provider"] = None
    app["speaker_matcher"] = None
    app.router.add_get("/", handle_index)
    app.router.add_get("/stream", handle_stream)
    app.router.add_get("/analysis/{session_id}", handle_analysis)
    app.router.add_get("/segments/{session_id}", handle_segments)
    app.router.add_post("/events/{session_id}", handle_events)
    app.router.add_get("/voice-profile", handle_voice_profile)
    app.router.add_post("/voice-profile", handle_voice_profile)
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
