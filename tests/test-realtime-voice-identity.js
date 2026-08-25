const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VENV_PYTHON = path.join(__dirname, '../tools/realtime-voice/venv/bin/python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const SERVER_MODULE_DIR = path.join(__dirname, '../tools/realtime-voice');

module.exports = {
  'voice-profile-stores-local-sample-metadata': () => {
    const script = `
import json, pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from voice_identity import VoiceProfileStore

with tempfile.TemporaryDirectory() as tmp:
    store = VoiceProfileStore(pathlib.Path(tmp))
    profile = store.create_profile([b'valid-audio-sample' * 512])
    assert profile['status'] == 'ready'
    assert profile['profile_id']
    assert len(profile['samples']) == 1
    metadata = store.profile_path.read_text(encoding='utf-8')
    assert 'valid-audio-sample' not in metadata, 'raw audio must not be in profile metadata'
    assert list(pathlib.Path(tmp).glob('sample-*.webm')), 'raw sample must stay in local profile directory'
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'voice-profile-rejects-empty-sample': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from voice_identity import VoiceProfileError, VoiceProfileStore

with tempfile.TemporaryDirectory() as tmp:
    try:
        VoiceProfileStore(pathlib.Path(tmp)).create_profile([b''])
    except VoiceProfileError as exc:
        assert 'empty' in str(exc)
    else:
        raise AssertionError('empty sample must be rejected')
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'speaker-attribution-keeps-stable-roles': () => {
    const script = `
import sys
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from voice_identity import SpeakerAttributor

attributor = SpeakerAttributor(operator_threshold=0.8)
assert attributor.from_evidence('operator', 0.95).role == 'pm'
assert attributor.from_evidence('speaker-a', 0.20).role == 'pending'
assert attributor.from_evidence('speaker-a', 0.90).speaker_id == 'client-1'
assert attributor.from_evidence('speaker-b', 0.90).speaker_id == 'client-2'
assert attributor.from_evidence(None, 0.90).role == 'pending'
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'speaker-embedding-adapter-normalizes-provider-output': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from voice_identity import ERes2NetV2EmbeddingProvider

class FakeModel:
    def generate(self, input):
        return [{"spk_embedding": [0.25, 0.5, 0.75]}]

with tempfile.TemporaryDirectory() as tmp:
    audio = pathlib.Path(tmp) / 'sample.wav'
    audio.write_bytes(b'audio')
    embedding = ERes2NetV2EmbeddingProvider(FakeModel()).extract(audio)
    assert embedding == [0.25, 0.5, 0.75]
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },
};
