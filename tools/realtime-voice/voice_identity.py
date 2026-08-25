"""本機聲音身份資料與說話人角色判別的最小邊界。

這個模組不負責把模型硬塞進收音流程。它提供：

* 本機 profile 儲存：原始樣本留在 profile 目錄，JSON 只存 metadata。
* provider 無關的角色歸類：模型不可用或信心不足時回傳 pending。
* 未來可接 FunASR ERes2NetV2/CAM++ 的 adapter 邊界。
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
import os
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Sequence


DEFAULT_PROFILE_DIR = Path(
    os.environ.get(
        "ANSON_VOICE_PROFILE_DIR",
        Path.home() / ".config" / "anson" / "voice-profile",
    )
)
PROFILE_FILENAME = "profile.json"
PROFILE_SCHEMA_VERSION = 1


class VoiceProfileError(ValueError):
    """使用者聲音樣本無法建立 profile 時的可讀錯誤。"""


class SpeakerModelError(RuntimeError):
    """本機 speaker model 無法載入或無法產生 embedding。"""


@dataclass(frozen=True)
class SpeakerIdentity:
    speaker_id: str
    role: str
    confidence: float
    identity_status: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class VoiceProfileStore:
    """以本機目錄保存聲音樣本與 profile metadata。"""

    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root) if root else DEFAULT_PROFILE_DIR
        self.profile_path = self.root / PROFILE_FILENAME

    def create_profile(
        self,
        samples: Sequence[bytes],
        *,
        model_name: str = "local-speaker-profile-pending",
    ) -> dict[str, object]:
        if not samples:
            raise VoiceProfileError("至少需要一段聲音樣本")

        metadata_samples: list[dict[str, object]] = []
        self.root.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(self.root, 0o700)
        except OSError:
            pass

        for index, sample in enumerate(samples, start=1):
            if not isinstance(sample, bytes) or not sample:
                raise VoiceProfileError(f"sample-{index} is empty")
            sample_path = self.root / f"sample-{index}.webm"
            sample_path.write_bytes(sample)
            try:
                os.chmod(sample_path, 0o600)
            except OSError:
                pass
            metadata_samples.append(
                {
                    "id": f"sample-{index}",
                    "filename": sample_path.name,
                    "bytes": len(sample),
                    "sha256": hashlib.sha256(sample).hexdigest(),
                }
            )

        profile = {
            "schema_version": PROFILE_SCHEMA_VERSION,
            "profile_id": f"operator-{uuid.uuid4().hex}",
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "model": model_name,
            "status": "ready",
            "samples": metadata_samples,
        }
        self.profile_path.write_text(
            json.dumps(profile, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        try:
            os.chmod(self.profile_path, 0o600)
        except OSError:
            pass
        return profile

    def load_profile(self) -> dict[str, object] | None:
        if not self.profile_path.exists():
            return None
        try:
            profile = json.loads(self.profile_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise VoiceProfileError(f"聲音身份資料無法讀取：{exc}") from exc
        if not isinstance(profile, dict) or profile.get("status") != "ready":
            raise VoiceProfileError("聲音身份資料格式不完整")
        return profile


class SpeakerAttributor:
    """把模型輸出的 speaker evidence 轉成穩定的 UI/API 角色。

    `operator` 是 adapter 對目前使用者 profile 的比對結果；其他穩定
    speaker id 只會得到匿名 client id，不會被猜成真實姓名。
    """

    def __init__(self, *, operator_threshold: float = 0.8) -> None:
        self.operator_threshold = operator_threshold
        self._clients: dict[str, str] = {}

    def from_evidence(
        self,
        speaker_key: str | None,
        operator_confidence: float,
    ) -> SpeakerIdentity:
        confidence = max(0.0, min(1.0, float(operator_confidence)))
        if not speaker_key or confidence < self.operator_threshold:
            return SpeakerIdentity("unknown", "pending", confidence, "pending")
        if speaker_key == "operator":
            return SpeakerIdentity("operator", "pm", confidence, "matched")

        client_id = self._clients.setdefault(
            speaker_key, f"client-{len(self._clients) + 1}"
        )
        return SpeakerIdentity(client_id, "client", confidence, "unmatched")


class ERes2NetV2EmbeddingProvider:
    """FunASR ERes2NetV2 的本機 embedding adapter。

    模型延遲載入，避免使用者只想收音時被迫下載 speaker model。FunASR
    官方的 `generate()` 回傳 `spk_embedding`，這裡只把它轉成一般 list，
    不把 FunASR 型別往 UI 或 server route 擴散。
    """

    MODEL_NAME = "iic/speech_eres2netv2_sv_zh-cn_16k-common"

    def __init__(self, model: object | None = None, *, device: str = "cpu") -> None:
        self._model = model
        self.device = device

    def _load_model(self) -> object:
        if self._model is not None:
            return self._model
        try:
            from funasr import AutoModel

            self._model = AutoModel(
                model=self.MODEL_NAME,
                device=self.device,
                disable_update=True,
            )
        except Exception as exc:  # noqa: BLE001 - provider boundary must expose the real cause
            raise SpeakerModelError(f"speaker model 載入失敗：{exc}") from exc
        return self._model

    def extract(self, audio_path: Path) -> list[float]:
        try:
            result = self._load_model().generate(input=str(audio_path))
            embedding = result[0].get("spk_embedding") if result else None
            if embedding is None:
                raise SpeakerModelError("speaker model 沒有回傳 spk_embedding")
            if hasattr(embedding, "detach"):
                embedding = embedding.detach().cpu().flatten().tolist()
            elif hasattr(embedding, "flatten"):
                embedding = embedding.flatten().tolist()
            values = [float(value) for value in embedding]
            if not values:
                raise SpeakerModelError("speaker embedding 是空的")
            return values
        except SpeakerModelError:
            raise
        except Exception as exc:  # noqa: BLE001 - provider boundary must expose the real cause
            raise SpeakerModelError(f"speaker embedding 產生失敗：{exc}") from exc


def cosine_similarity(left: Iterable[float], right: Iterable[float]) -> float:
    """計算兩個 embedding 的 cosine similarity，避免零向量誤判。"""
    left_values = list(left)
    right_values = list(right)
    if len(left_values) != len(right_values) or not left_values:
        raise ValueError("embedding dimensions must match and cannot be empty")
    dot = sum(a * b for a, b in zip(left_values, right_values))
    left_norm = math.sqrt(sum(value * value for value in left_values))
    right_norm = math.sqrt(sum(value * value for value in right_values))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)
