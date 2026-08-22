const { execFileSync } = require('child_process');
const path = require('path');

const PYTHON = path.join(__dirname, '../tools/realtime-voice/venv/bin/python');
const SERVER_MODULE_DIR = path.join(__dirname, '../tools/realtime-voice');

module.exports = {
  'low-confidence-segment-is-flagged-not-guessed': () => {
    const script = `
import sys
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
import server

# 太短的音訊片段：不能靜默丟棄、也不能亂猜內容
result = server.transcribe_segment(None, None, b"\\x00" * 100)
assert result == server.LOW_CONFIDENCE_MARK, f"expected {server.LOW_CONFIDENCE_MARK!r}, got {result!r}"
print("ok")
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') {
      throw new Error(`unexpected output: ${output}`);
    }
  },

  'recognized-segment-appends-formatted-line-to-session-file': () => {
    const script = `
import sys, tempfile, pathlib
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
import server

with tempfile.TemporaryDirectory() as tmp:
    server.OUTPUT_DIR = pathlib.Path(tmp)
    server.append_transcript_line("test-session", "測試逐字稿內容")
    out_file = server.OUTPUT_DIR / "test-session.md"
    assert out_file.exists(), "session output file must be created"
    content = out_file.read_text(encoding="utf-8")
    assert content.startswith("- ["), f"line must start with '- [', got: {content!r}"
    assert "測試逐字稿內容" in content, f"transcript text missing from line: {content!r}"
print("ok")
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') {
      throw new Error(`unexpected output: ${output}`);
    }
  },

  'each-session-gets-its-own-output-file': () => {
    const script = `
import sys, tempfile, pathlib
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
import server

with tempfile.TemporaryDirectory() as tmp:
    server.OUTPUT_DIR = pathlib.Path(tmp)
    server.append_transcript_line("session-a", "第一場對談")
    server.append_transcript_line("session-b", "第二場對談")
    files = sorted(p.name for p in server.OUTPUT_DIR.iterdir())
    assert files == ["session-a.md", "session-b.md"], f"expected two distinct session files, got: {files}"
print("ok")
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') {
      throw new Error(`unexpected output: ${output}`);
    }
  }
};
