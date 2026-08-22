// 第三方服務即時示意畫面產生器。有範本就嵌，沒範本要明講，不能悄悄消失。
const KNOWN_TEMPLATES = {
  'line-oa': (req) => `<div class="integration-embed line-oa" data-service="${req.third_party_service}">LINE OA 對話框示意</div>`,
  'line': (req) => `<div class="integration-embed line-oa" data-service="${req.third_party_service}">LINE OA 對話框示意</div>`,
};

function generateServiceIntegrationTemplate(requirement) {
  const key = String(requirement.third_party_service || '').toLowerCase();
  const template = KNOWN_TEMPLATES[key];

  if (template) {
    return template(requirement);
  }

  return `<div class="integration-embed placeholder" data-service="${requirement.third_party_service}">尚無此服務的示意範本（${requirement.third_party_service}）</div>`;
}

module.exports = { generateServiceIntegrationTemplate };
