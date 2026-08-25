const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PYTHON = path.join(__dirname, '../tools/realtime-voice/venv/bin/python');
const MODULE_DIR = path.join(__dirname, '../tools/realtime-voice');

module.exports = {
  'macos-icloud-profile-is-detected-and-migrated': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(MODULE_DIR)})
from voice_identity import VoiceProfileStore
from voice_profile_sync import resolve_profile_storage

with tempfile.TemporaryDirectory() as tmp:
    home = pathlib.Path(tmp) / 'home'
    icloud = pathlib.Path(tmp) / 'icloud'
    icloud.mkdir(parents=True)
    source = VoiceProfileStore(home / '.config' / 'anson' / 'voice-profile')
    source.create_profile([b'macos-sample' * 32])
    storage = resolve_profile_storage(
        home=home, platform='darwin',
        env={'ANSON_ICLOUD_ROOT': str(icloud), 'ANSON_VOICE_PROFILE_CONFIG': str(home / 'config.json')},
    )
    assert storage.status == 'synced_icloud'
    assert storage.profile_dir == icloud / 'Awesome-Anson' / 'voice-profile'
    assert (storage.profile_dir / 'profile.json').exists()
    assert (source.profile_path).exists()
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'windows-google-drive-profile-is-selected': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(MODULE_DIR)})
from voice_profile_sync import resolve_profile_storage

with tempfile.TemporaryDirectory() as tmp:
    home = pathlib.Path(tmp) / 'home'
    drive = pathlib.Path(tmp) / 'google-drive'
    drive.mkdir(parents=True)
    storage = resolve_profile_storage(
        home=home, platform='win32',
        env={'ANSON_GOOGLE_DRIVE_ROOT': str(drive), 'ANSON_VOICE_PROFILE_CONFIG': str(home / 'config.json')},
    )
    assert storage.status == 'synced_google_drive'
    assert storage.profile_dir == drive / 'Awesome-Anson' / 'voice-profile'
    assert storage.profile_dir.exists()
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'profile-sync-conflict-never-overwrites': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(MODULE_DIR)})
from voice_identity import VoiceProfileStore
from voice_profile_sync import resolve_profile_storage

with tempfile.TemporaryDirectory() as tmp:
    home = pathlib.Path(tmp) / 'home'
    icloud = pathlib.Path(tmp) / 'icloud'
    local = VoiceProfileStore(home / '.config' / 'anson' / 'voice-profile')
    local.create_profile([b'local-sample' * 32])
    remote = VoiceProfileStore(icloud / 'Awesome-Anson' / 'voice-profile')
    remote.create_profile([b'remote-sample' * 32])
    before = remote.profile_path.read_text(encoding='utf-8')
    storage = resolve_profile_storage(
        home=home, platform='darwin',
        env={'ANSON_ICLOUD_ROOT': str(icloud), 'ANSON_VOICE_PROFILE_CONFIG': str(home / 'config.json')},
    )
    assert storage.status == 'profile_sync_conflict'
    assert remote.profile_path.read_text(encoding='utf-8') == before
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'partial-sync-profile-is-not-overwritten': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(MODULE_DIR)})
from voice_identity import VoiceProfileStore
from voice_profile_sync import resolve_profile_storage

with tempfile.TemporaryDirectory() as tmp:
    home = pathlib.Path(tmp) / 'home'
    icloud = pathlib.Path(tmp) / 'icloud'
    icloud.mkdir(parents=True)
    local = VoiceProfileStore(home / '.config' / 'anson' / 'voice-profile')
    local.create_profile([b'local-sample' * 32])
    remote = icloud / 'Awesome-Anson' / 'voice-profile'
    remote.mkdir(parents=True)
    (remote / 'profile.json').write_text('{"status":"ready","samples":[]}', encoding='utf-8')
    storage = resolve_profile_storage(
        home=home, platform='darwin',
        env={'ANSON_ICLOUD_ROOT': str(icloud), 'ANSON_VOICE_PROFILE_CONFIG': str(home / 'config.json')},
    )
    assert storage.status == 'profile_sync_conflict'
    assert '尚未完整同步' in storage.message
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },
};
