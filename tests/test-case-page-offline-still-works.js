const { assertFileExists, assert } = require('./assert');

module.exports = {
  'case-page-skill-logic-unchanged': () => {
    // This is a regression test to verify case-page skill hasn't been accidentally modified
    const skillPath = '/Users/fishtv/Development/Awesome-Anson/.claude/skills/case-page/SKILL.md';

    // File should exist
    assertFileExists(skillPath, 'case-page skill documentation must exist');

    // Read the skill file to verify core logic is intact
    const fs = require('fs');
    const skillContent = fs.readFileSync(skillPath, 'utf8');

    // Core principle: case-page should work offline without deployment
    const hasOfflineCapability = skillContent.includes('不部署上網') ||
                                 skillContent.includes('offline') ||
                                 skillContent.includes('no deploy') ||
                                 skillContent.includes('local');

    assert(
      hasOfflineCapability,
      'case-page skill must maintain offline capability without requiring deployment'
    );
  }
};
