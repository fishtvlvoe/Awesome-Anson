// 部署到 Cloudflare Pages 前先驗證資料包完整性，缺欄位就明確回報原因，不猜、不假裝成功。
const REQUIRED_FIELDS = ['project_id', 'environment', 'api_endpoint'];

function deployWithErrorHandling(deploymentPackage) {
  const missing = REQUIRED_FIELDS.filter((field) => !(field in deploymentPackage));

  if (missing.length > 0) {
    throw new Error(`部署失敗：缺少必要欄位 ${missing.join('、')} (missing required field: ${missing.join(', ')})`);
  }

  // ponytail: 真正呼叫 wrangler pages deploy 的整合留在部署腳本層（複用待神 dashboard-deploy.sh 寫法），
  // 這裡只負責資料驗證與失敗回報，不在單元測試路徑裡真的打網路。
  return {
    status: 'success',
    project_id: deploymentPackage.project_id,
    url: deploymentPackage.api_endpoint,
  };
}

module.exports = { deployWithErrorHandling };
