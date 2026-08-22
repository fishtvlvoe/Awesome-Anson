const { assert } = require('./assert');

module.exports = {
  'media-generation-failure-displays-error-notice': () => {
    // This function should exist but doesn't yet
    const { generateMediaBlock } = require('../lib/media-generation');

    const mediaRequest = {
      type: 'hero-image',
      prompt: 'professional office scene',
      // API will fail for this minimal request
    };

    // Mock API failure scenario
    let generatedContent = '';

    try {
      generatedContent = generateMediaBlock(mediaRequest);
    } catch (err) {
      generatedContent = err.rendered_output || '';
    }

    // When media generation fails, should show explicit error notice
    const hasErrorNotice = generatedContent &&
                          typeof generatedContent === 'string' &&
                          (generatedContent.includes('此區塊生成失敗') ||
                           generatedContent.includes('生成失敗') ||
                           generatedContent.includes('generation failed') ||
                           generatedContent.includes('unable to generate'));

    assert(
      hasErrorNotice,
      'Media generation failure must display clear error notice, not leave blank space'
    );
  }
};
