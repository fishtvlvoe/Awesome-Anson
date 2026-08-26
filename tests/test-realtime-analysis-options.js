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
from advisor_cli import parse_advisor_output

base = {
    'client_response': ['客戶確認要先做預約'],
    'current_state': '客戶已說明目前狀況',
    'confirmed': ['先做預約'],
    'open_questions': ['成功標準'],
    'quote_impact': '先收斂範圍',
    'mental_model': '核心結果 × 可延後範圍',
    'evidence': ['預約是第一版重點'],
    'recommended_next_move': '先跟客戶確認成功標準',
    'speaker_attribution': [{'segment_id': 'seg-0001', 'role': 'client', 'confidence': 0.9, 'reason': '回答需求'}],
    'route': 'realtime-need-capture',
}
for count in (1, 2, 3):
    payload = {**base, 'response_options': [f'回應 {i}' for i in range(count)]}
    assert len(parse_advisor_output(__import__('json').dumps(payload))['response_options']) == count
for bad in (['一', '二', '三', '四'],):
    try:
        parse_advisor_output(__import__('json').dumps({**base, 'response_options': bad}))
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
