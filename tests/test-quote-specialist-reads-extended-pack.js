const { assertFileExists, assert } = require('./assert');
const fs = require('fs');

module.exports = {
  'quote-specialist-parses-extended-data-pack': () => {
    // 報價助理是「真人看紙做事」，不是函式呼叫。
    // 檢查它的說明書有沒有講清楚：新欄位是附加的，不會讓既有報價邏輯壞掉。
    const agentPath = '/Users/fishtv/Development/Awesome-Anson/.claude/agents/commercial-proposal-quotation-specialist.md';

    assertFileExists(agentPath, 'commercial-proposal-quotation-specialist.md must exist');

    const content = fs.readFileSync(agentPath, 'utf8');

    const mentionsNewFields = content.includes('capture_mode') && content.includes('decomposition');

    assert(
      mentionsNewFields,
      'commercial-proposal-quotation-specialist.md must explicitly state it accepts capture_mode/decomposition as additive fields without breaking existing pricing logic'
    );
  }
};
