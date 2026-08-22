const { assertFileExists, assert } = require('./assert');
const fs = require('fs');

module.exports = {
  'service-type-returns-12-cell-array': () => {
    // 「服務型任務要拆 12 格，不是 5 分類」是 AI 判斷的規則，
    // 檢查說明書有沒有把這條規矩寫清楚。
    const skillPath = '/Users/fishtv/Development/Awesome-Anson/.claude/skills/realtime-need-capture/SKILL.md';

    assertFileExists(skillPath, 'realtime-need-capture SKILL.md must exist');

    const content = fs.readFileSync(skillPath, 'utf8');

    const mentions4x4 = content.includes('4x4') || content.includes('4×4') || content.includes('12 格') || content.includes('12格');
    const mentionsServiceType = content.includes('服務型');

    assert(
      mentions4x4 && mentionsServiceType,
      'SKILL.md must instruct: service-type engagements SHALL use the 4x4 (12-cell) breakdown instead of the 5-category breakdown'
    );
  }
};
