const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VENV_PYTHON = path.join(__dirname, '../tools/realtime-voice/venv/bin/python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const SERVER_MODULE_DIR = path.join(__dirname, '../tools/realtime-voice');

module.exports = {
  'realtime-page-keeps-recording-transcript-and-status': () => {
    const html = fs.readFileSync(path.join(__dirname, '../tools/realtime-voice/static/index.html'), 'utf8');
    for (const marker of ['id="toggle"', 'id="transcript"', 'id="advisor-status"', '顧問已連線', '顧問未連線']) {
      if (!html.includes(marker)) throw new Error(`one-time setup marker is missing: ${marker}`);
    }
    if (html.includes('commandThread') || html.includes('analysisResponseOptions')) throw new Error('retired advisor UI remains');
    if (!html.includes('const segmentChunks = []') || !html.includes('new Blob(segmentChunks')) throw new Error('recorder segments must keep independent buffers');
  },

  'voice-profile-request-limit-allows-configured-sample-size': () => {
    const script = `
import sys
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
import server

app = server.build_app(object(), object(), 'session-a')
assert app._client_max_size == server.MAX_VOICE_PROFILE_BYTES
assert app._client_max_size >= 20 * 1024 * 1024
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

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
assert attributor.from_evidence(None, 0.20).role == 'pending'
assert attributor.from_evidence('speaker-a', 0.20).speaker_id == 'client-1'
assert attributor.from_evidence('speaker-b', 0.90).speaker_id == 'client-2'
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

  'profile-matcher-returns-operator-client-and-pending': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from voice_identity import ProfileSpeakerMatcher

class FakeProvider:
    def __init__(self, values): self.values = values
    def extract(self, path): return self.values[path.name]

with tempfile.TemporaryDirectory() as tmp:
    root = pathlib.Path(tmp)
    operator = root / 'operator.wav'; client = root / 'client.wav'; unknown = root / 'unknown.wav'
    for path in (operator, client, unknown): path.write_bytes(b'audio')
    provider = FakeProvider({operator.name: [1, 0], client.name: [0, 1], unknown.name: [0, 0]})
    matcher = ProfileSpeakerMatcher([1, 0], provider, operator_threshold=0.8)
    assert matcher.classify(operator).role == 'pm'
    assert matcher.classify(client, speaker_key='speaker-a').speaker_id == 'client-1'
    assert matcher.classify(unknown).role == 'pending'
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'speaker-model-failure-never-fakes-a-role': () => {
    const script = `
import pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from voice_identity import ProfileSpeakerMatcher, SpeakerModelError

class BrokenProvider:
    def extract(self, path): raise SpeakerModelError('model unavailable')

with tempfile.TemporaryDirectory() as tmp:
    audio = pathlib.Path(tmp) / 'sample.wav'
    audio.write_bytes(b'audio')
    result = ProfileSpeakerMatcher([1, 0], BrokenProvider()).classify(audio, speaker_key='speaker-a')
    assert result.role == 'pending'
    assert result.identity_status == 'pending'
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'segment-metadata-keeps-markdown-compatibility': () => {
    const script = `
import json, pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
import server
from voice_identity import SpeakerIdentity

with tempfile.TemporaryDirectory() as tmp:
    server.OUTPUT_DIR = pathlib.Path(tmp)
    identity = SpeakerIdentity('client-1', 'client', 0.42, 'unmatched')
    server.append_transcript_line('session-a', '客戶想先看預約流程')
    server.append_segment_metadata('session-a', '客戶想先看預約流程', identity, timestamp='2026-08-25T12:00:00+00:00')
    markdown = (pathlib.Path(tmp) / 'session-a.md').read_text(encoding='utf-8')
    segment = json.loads((pathlib.Path(tmp) / 'session-a.segments.jsonl').read_text(encoding='utf-8'))
    assert markdown.endswith('客戶想先看預約流程\\n')
    assert segment['speaker_id'] == 'client-1'
    assert segment['id'] == 'seg-0001'
    assert segment['role'] == 'client'
    assert segment['confidence'] == 0.42
    assert segment['identity_status'] == 'unmatched'
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },

  'session-events-record-selection-without-generation': () => {
    const script = `
import json, pathlib, sys, tempfile
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
import server

with tempfile.TemporaryDirectory() as tmp:
    server.OUTPUT_DIR = pathlib.Path(tmp)
    server.append_session_event('session-a', {
        'event_type': 'response_option_selected',
        'option_index': 1,
        'option': '先確認第一版成功標準',
        'evidence_segment_ids': ['seg-0001'],
    })
    server.append_session_event('session-a', {
        'event_type': 'demo_triggered',
        'trigger_phrase': '我覺得這個方向可以，那我們開始做 DEMO 好不好？',
    })
    rows = [json.loads(line) for line in (pathlib.Path(tmp) / 'session-a.events.jsonl').read_text(encoding='utf-8').splitlines()]
    assert [row['event_type'] for row in rows] == ['response_option_selected', 'demo_triggered']
    assert rows[0]['option_index'] == 1
    assert rows[0]['evidence_segment_ids'] == ['seg-0001']
    assert rows[1]['trigger_phrase'].startswith('我覺得這個方向可以')
    try:
        server.append_session_event('session-a', {'event_type': 'run_code'})
    except ValueError:
        pass
    else:
        raise AssertionError('unknown event must be rejected')
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },
};
