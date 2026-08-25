const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VENV_PYTHON = path.join(__dirname, '../tools/realtime-voice/venv/bin/python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const SERVER_MODULE_DIR = path.join(__dirname, '../tools/realtime-voice');

module.exports = {
  'analysis-requires-one-to-three-response-options': () => {
    const script = `
import sys
sys.path.insert(0, ${JSON.stringify(SERVER_MODULE_DIR)})
from monitor_transcript import parse_agent_output

base = {
    'client_response': ['客戶確認要先做預約'],
    'mental_model': '核心結果 × 可延後範圍',
    'evidence': ['預約是第一版重點'],
    'decomposition': {'need': {'value': '預約', 'state': 'confirmed'}},
    'conclusion': '先確認第一版核心結果',
    'suggestion': '先跟客戶確認成功標準',
}
for count in (1, 2, 3):
    payload = {**base, 'response_options': [f'回應 {i}' for i in range(count)]}
    assert len(parse_agent_output(__import__('json').dumps(payload))['response_options']) == count
for bad in ([], ['一', '二', '三', '四']):
    try:
        parse_agent_output(__import__('json').dumps({**base, 'response_options': bad}))
    except ValueError:
        pass
    else:
        raise AssertionError('invalid response option count must fail')
print('ok')
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== 'ok') throw new Error(`unexpected output: ${output}`);
  },
};
