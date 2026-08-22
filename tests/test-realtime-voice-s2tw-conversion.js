const { execFileSync } = require('child_process');
const path = require('path');

const PYTHON = path.join(__dirname, '../tools/realtime-voice/venv/bin/python');

module.exports = {
  'sensevoice-simplified-output-converted-to-traditional': () => {
    const script = `
from opencc import OpenCC
cc = OpenCC('s2twp')
print(cc.convert('开放时间早上9点至下午5点。'))
`;
    const output = execFileSync(PYTHON, ['-c', script], { encoding: 'utf8' }).trim();
    if (output !== '開放時間早上9點至下午5點。') {
      throw new Error(`expected 開放時間早上9點至下午5點。 but got: ${output}`);
    }
  }
};
