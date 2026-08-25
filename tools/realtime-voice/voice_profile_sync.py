"""Resolve and safely migrate the local voice profile directory.

The application only reads provider-managed local folders. It does not call
iCloud or Google Drive APIs and never stores credentials in this module.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


PROFILE_DIR_ENV = "ANSON_VOICE_PROFILE_DIR"
PROFILE_CONFIG_ENV = "ANSON_VOICE_PROFILE_CONFIG"
ICLOUD_ROOT_ENV = "ANSON_ICLOUD_ROOT"
GOOGLE_DRIVE_ROOT_ENV = "ANSON_GOOGLE_DRIVE_ROOT"
SYNC_FOLDER = Path("Awesome-Anson") / "voice-profile"
PROFILE_FILENAME = "profile.json"


class ProfileSyncError(RuntimeError):
    """A profile cannot be selected safely."""


@dataclass(frozen=True)
class ProfileStorage:
    profile_dir: Path
    provider: str | None
    status: str
    message: str


def _platform_name(platform: str | None = None) -> str:
    if platform:
        return platform.lower()
    return sys.platform.lower()


def config_path(*, home: Path | None = None, platform: str | None = None, env: Mapping[str, str] | None = None) -> Path:
    env = env or os.environ
    if env.get(PROFILE_CONFIG_ENV):
        return Path(env[PROFILE_CONFIG_ENV]).expanduser()
    home = home or Path.home()
    platform = _platform_name(platform)
    if platform.startswith("darwin"):
        return home / "Library" / "Application Support" / "Awesome-Anson" / "voice-profile-sync.json"
    if platform.startswith("win"):
        return Path(env.get("APPDATA", home / "AppData" / "Roaming")) / "Awesome-Anson" / "voice-profile-sync.json"
    return home / ".config" / "anson" / "voice-profile-sync.json"


def local_profile_dir(*, home: Path | None = None) -> Path:
    return (home or Path.home()) / ".config" / "anson" / "voice-profile"


def _sync_root_candidates(*, home: Path, platform: str, env: Mapping[str, str]) -> list[tuple[str, Path]]:
    if platform.startswith("darwin"):
        root = Path(env.get(ICLOUD_ROOT_ENV, home / "Library" / "Mobile Documents" / "com~apple~CloudDocs")).expanduser()
        return [("icloud", root)] if root.is_dir() else []
    if platform.startswith("win"):
        roots: list[Path] = []
        configured = env.get(GOOGLE_DRIVE_ROOT_ENV) or env.get("GOOGLE_DRIVE_ROOT")
        if configured:
            roots.append(Path(configured).expanduser())
        roots.extend([
            home / "Google Drive" / "My Drive",
            home / "Google Drive",
            Path("G:/My Drive"),
            Path("G:/Google Drive"),
        ])
        for letter in "CDEFGHIJKLMNOPQRSTUVWXYZ":
            roots.append(Path(f"{letter}:/My Drive"))
        unique = []
        seen: set[str] = set()
        for root in roots:
            key = str(root).lower()
            if key not in seen and root.is_dir():
                seen.add(key)
                unique.append(("google_drive", root))
        return unique
    return []


def _read_saved_config(path: Path) -> ProfileStorage | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        profile_dir = Path(payload["profile_dir"]).expanduser()
        if not profile_dir.is_dir():
            return None
        return ProfileStorage(profile_dir, payload.get("provider"), payload.get("status", "local_only"), "已讀取保存的 profile 路徑")
    except (OSError, UnicodeError, json.JSONDecodeError, KeyError, TypeError):
        return None


def _save_config(storage: ProfileStorage, *, home: Path, platform: str, env: Mapping[str, str]) -> None:
    path = config_path(home=home, platform=platform, env=env)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_version": 1,
        "profile_dir": str(storage.profile_dir),
        "provider": storage.provider,
        "status": storage.status,
    }
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def _profile_fingerprint(profile_dir: Path) -> str | None:
    profile_path = profile_dir / PROFILE_FILENAME
    try:
        payload = json.loads(profile_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict) or payload.get("status") != "ready" or not payload.get("profile_id"):
            return None
        digest = hashlib.sha256()
        digest.update(str(payload.get("profile_id", "")).encode())
        samples = payload.get("samples", [])
        if not isinstance(samples, list) or not samples:
            return None
        for sample in samples:
            filename = Path(str(sample["filename"]).replace("\\", "/")).name
            sample_path = profile_dir / filename
            if not sample_path.is_file() or hashlib.sha256(sample_path.read_bytes()).hexdigest() != sample.get("sha256"):
                return None
            digest.update(str(sample.get("sha256", "")).encode())
        return digest.hexdigest()
    except (OSError, UnicodeError, json.JSONDecodeError, KeyError, TypeError):
        return None


def _copy_profile(source: Path, target: Path) -> None:
    source_fingerprint = _profile_fingerprint(source)
    if source_fingerprint is None:
        raise ProfileSyncError("來源聲音身份不完整，無法同步")
    target.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".voice-profile-", dir=target.parent))
    try:
        payload = json.loads((source / PROFILE_FILENAME).read_text(encoding="utf-8"))
        filenames = [PROFILE_FILENAME] + [Path(str(item["filename"]).replace("\\", "/")).name for item in payload.get("samples", [])]
        for filename in filenames:
            shutil.copy2(source / filename, staging / filename)
        if _profile_fingerprint(staging) != source_fingerprint:
            raise ProfileSyncError("聲音身份 checksum 驗證失敗，未切換同步位置")
        if target.exists():
            shutil.rmtree(target)
        staging.replace(target)
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def resolve_profile_storage(*, env: Mapping[str, str] | None = None, home: Path | None = None, platform: str | None = None) -> ProfileStorage:
    env = dict(env or os.environ)
    home = (home or Path.home()).expanduser()
    platform = _platform_name(platform)
    explicit = env.get(PROFILE_DIR_ENV)
    if explicit:
        storage = ProfileStorage(Path(explicit).expanduser(), "explicit", "explicit", "使用明確指定的 profile 路徑")
        _save_config(storage, home=home, platform=platform, env=env)
        return storage

    saved = _read_saved_config(config_path(home=home, platform=platform, env=env))
    if saved:
        return saved

    candidates = _sync_root_candidates(home=home, platform=platform, env=env)
    if len(candidates) == 1:
        provider, root = candidates[0]
        storage = ProfileStorage(root / SYNC_FOLDER, provider, f"synced_{provider}", f"已偵測 {provider} 同步資料夾")
        local = local_profile_dir(home=home)
        sync_fingerprint = _profile_fingerprint(storage.profile_dir)
        local_fingerprint = _profile_fingerprint(local)
        sync_profile_exists = (storage.profile_dir / PROFILE_FILENAME).exists()
        if local_fingerprint and sync_fingerprint and local_fingerprint != sync_fingerprint:
            return ProfileStorage(local, provider, "profile_sync_conflict", "本機與同步位置的聲音身份不同，未自動覆蓋")
        if local_fingerprint and sync_profile_exists and not sync_fingerprint:
            return ProfileStorage(local, provider, "profile_sync_conflict", "同步位置的聲音身份尚未完整同步，未自動覆蓋")
        if local_fingerprint and not sync_fingerprint:
            _copy_profile(local, storage.profile_dir)
        storage.profile_dir.mkdir(parents=True, exist_ok=True)
        _save_config(storage, home=home, platform=platform, env=env)
        return storage
    if len(candidates) > 1:
        return ProfileStorage(local_profile_dir(home=home), None, "profile_sync_conflict", "找到多個同步資料夾，未猜測使用哪一個")

    storage = ProfileStorage(local_profile_dir(home=home), None, "local_only", "未找到同步服務，使用本機 profile")
    return storage
