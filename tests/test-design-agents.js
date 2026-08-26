const fs = require('fs');
const path = require('path');
const { assert, assertEqual, assertFileExists } = require('./assert');

const agentDir = path.resolve(__dirname, '../.claude/agents');
const expectedAgents = [
  ['網頁設計師.md', '網頁設計師'],
  ['案例設計師.md', '案例設計師'],
  ['風格設計師.md', '風格設計師'],
  ['前端設計師.md', '前端設計師'],
];

module.exports = {
  'Anson design quartet is present with stable names': () => {
    for (const [fileName, name] of expectedAgents) {
      const filePath = path.join(agentDir, fileName);
      assertFileExists(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      assertEqual(content.match(/^name:\s*(.+)$/m)?.[1], name);
    }
  },

  'web designer is the unified design entry point': () => {
    const content = fs.readFileSync(path.join(agentDir, '網頁設計師.md'), 'utf8');
    for (const marker of ['案例設計師', '風格設計師', '前端設計師', 'UIUX Pro Max', 'VibePrompts', 'Tabler']) {
      assert(content.includes(marker), `網頁設計師缺少整合能力：${marker}`);
    }
  },

  'design agents do not depend on the desktop absolute home path': () => {
    for (const [fileName] of expectedAgents) {
      const content = fs.readFileSync(path.join(agentDir, fileName), 'utf8');
      assert(!content.includes('/Users/fishtv/'), `${fileName} 含桌機專用絕對路徑`);
    }
  },
};
