const { assertFileExists, assert } = require('./assert');
const fs = require('fs');

module.exports = {
  'low-confidence-speech-segment-flagged': () => {
    // 這是「真人（AI）看紙做事」的規則，不是機器人函式。
    // 檢查說明書（SKILL.md）裡有沒有把這條規則寫清楚，AI 才有規矩可以照做。
    const skillPath = '/Users/fishtv/Development/Awesome-Anson/.claude/skills/realtime-need-capture/SKILL.md';

    assertFileExists(skillPath, 'realtime-need-capture SKILL.md must exist');

    const content = fs.readFileSync(skillPath, 'utf8');

    assert(
      content.includes('聽不清楚，需要人工補'),
      'SKILL.md must instruct: low-confidence segments SHALL be marked "聽不清楚，需要人工補", never silently guessed'
    );
  }
};
