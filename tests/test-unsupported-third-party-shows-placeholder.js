const { assert } = require('./assert');

module.exports = {
  'unsupported-service-shows-template-placeholder': () => {
    // This function should exist but doesn't yet
    const { generateServiceIntegrationTemplate } = require('../lib/integration-template-generator');

    const requirement = {
      third_party_service: 'uncommon-erp-system',  // Service with no existing template
      integration_type: 'data-sync'
    };

    const output = generateServiceIntegrationTemplate(requirement);

    // When no template exists, output should explicitly show a placeholder message
    const hasPlaceholder = output &&
                          typeof output === 'string' &&
                          (output.includes('尚無此服務的示意範本') ||
                           output.includes('無此服務的') ||
                           output.includes('placeholder') ||
                           output.includes('not yet supported'));

    assert(
      hasPlaceholder,
      'Unsupported third-party service must show explicit placeholder text, not disappear'
    );
  }
};
