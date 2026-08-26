const fs = require('fs');
const path = require('path');
const { assert, assertEqual, assertFileExists } = require('./assert');

const agentDir = path.resolve(__dirname, '../.claude/agents');

module.exports = {
  'presentation and quotation agents are available by Chinese names': () => {
    for (const [fileName, name] of [['簡報師.md', '簡報師'], ['報價師.md', '報價師']]) {
      const filePath = path.join(agentDir, fileName);
      assertFileExists(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      assertEqual(content.match(/^name:\s*(.+)$/m)?.[1], name);
    }
  },

  'quotation alias points to one canonical specification': () => {
    const alias = fs.readFileSync(path.join(agentDir, '報價師.md'), 'utf8');
    assert(alias.includes('commercial-proposal-quotation-specialist.md'));
    assert(alias.includes('不得複製'));
  },
};
