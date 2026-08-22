const { assertFileExists, assert } = require('./assert');
const fs = require('fs');

module.exports = {
  'assumed-guess-tag-prevents-auto-confirmation': () => {
    // 「我猜的」項目不能被自動升級成「已確認」，這是 AI 判斷的規則，
    // 檢查說明書有沒有把這條規矩寫清楚。
    const skillPath = '/Users/fishtv/Development/Awesome-Anson/.claude/skills/realtime-need-capture/SKILL.md';

    assertFileExists(skillPath, 'realtime-need-capture SKILL.md must exist');

    const content = fs.readFileSync(skillPath, 'utf8');

    const mentionsThreeStates = content.includes('已確認') && content.includes('待確認') && content.includes('我猜的');
    const mentionsNeverAutoConfirm = content.includes('不能') || content.includes('SHALL NOT') || content.includes('永遠不');

    assert(
      mentionsThreeStates && mentionsNeverAutoConfirm,
      'SKILL.md must instruct: items tagged 我猜的 SHALL NOT be automatically upgraded to 已確認'
    );
  }
};
