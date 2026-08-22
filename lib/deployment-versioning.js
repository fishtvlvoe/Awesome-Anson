// 記錄每個專案目前線上生效的部署網址，部署失敗時不覆寫，讓舊版繼續可用。
const activeDeployments = new Map();

function registerDeploymentState(projectId, state) {
  activeDeployments.set(projectId, state);
}

function getActiveDeploymentUrl(projectId) {
  const state = activeDeployments.get(projectId);
  return state ? state.active_url : null;
}

module.exports = { registerDeploymentState, getActiveDeploymentUrl };
