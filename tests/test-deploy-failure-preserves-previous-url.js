const { assertEqual } = require('./assert');

module.exports = {
  'deploy-failure-keeps-previous-version-online': () => {
    // This function should exist but doesn't yet
    const { getActiveDeploymentUrl, registerDeploymentState } = require('../lib/deployment-versioning');
    const { deployWithErrorHandling } = require('../lib/deployment-engine');

    // Simulate getting the previous stable deployment URL
    const previousDeploymentUrl = 'https://api.example.com/v2.1';

    // Store original URL state (mock) — 模擬 proj-999 目前已有一個上線中的舊版本
    const deploymentState = {
      active_url: previousDeploymentUrl,
      version: '2.1'
    };
    registerDeploymentState('proj-999', deploymentState);

    // Attempt a deployment that will fail
    const failedDeployment = {
      project_id: 'proj-999',
      environment: 'production',
      // intentionally missing required fields to cause failure
    };

    try {
      deployWithErrorHandling(failedDeployment);
    } catch (err) {
      // Expected to fail
    }

    // After failure, previous URL should still be accessible
    const activeUrl = getActiveDeploymentUrl('proj-999');

    assertEqual(
      activeUrl,
      previousDeploymentUrl,
      'Previous deployment URL must remain active when new deployment fails'
    );
  }
};
