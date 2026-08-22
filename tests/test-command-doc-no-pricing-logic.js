const { assertFileExists, assert } = require('./assert');

module.exports = {
  'anson-to-quotemaster-contract-excludes-pricing-logic': () => {
    // This contract document should exist but currently doesn't
    const contractPath = '/Users/fishtv/Development/Awesome-Anson/contracts/ANSON-TO-QUOTEMASTER-COMMAND.md';

    // File must exist
    assertFileExists(contractPath, 'Contract document ANSON-TO-QUOTEMASTER-COMMAND.md must exist');

    // Read and verify no pricing/countdown/sales logic
    const fs = require('fs');
    const contractContent = fs.readFileSync(contractPath, 'utf8');

    // Prohibited keywords that indicate pricing/sales logic
    const prohibitedKeywords = [
      '倒數',
      '漲價',
      '催單',
      '價格',  // General pricing term
      '折扣',
      '限時',
      '搶單'
    ];

    const hasPricingLogic = prohibitedKeywords.some(keyword =>
      contractContent.includes(keyword)
    );

    assert(
      !hasPricingLogic,
      'Contract document must be pure data format definition without pricing, countdown, or sales-push logic'
    );
  }
};
