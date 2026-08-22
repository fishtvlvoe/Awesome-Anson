// 依需求資料包判斷要 provision 哪些資源，不需要登入就不建 D1，避免多餘資源。
function analyzeDeploymentRequirements(dataPackage) {
  const resources = [];

  if (dataPackage.requires_authentication || dataPackage.requires_database) {
    resources.push('D1');
  }

  (dataPackage.features || []).forEach((feature) => {
    resources.push(`static-page:${feature}`);
  });

  return { project_id: dataPackage.project_id, resources };
}

module.exports = { analyzeDeploymentRequirements };
