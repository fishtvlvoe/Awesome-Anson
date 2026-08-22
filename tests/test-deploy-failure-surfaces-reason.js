const { assert } = require('./assert');

module.exports = {
  'deploy-failure-includes-specific-reason': () => {
    // This function should exist but doesn't yet
    const { deployWithErrorHandling } = require('../lib/deployment-engine');

    // Simulate a deployment package with missing required field
    const deploymentPackage = {
      project_id: 'proj-789',
      environment: 'production',
      // missing 'api_endpoint' - intentional to trigger failure
    };

    let errorMessage = '';

    try {
      deployWithErrorHandling(deploymentPackage);
    } catch (err) {
      errorMessage = err.message;
    }

    // Error message must include specific reason, not be vague
    const hasSpecificReason = errorMessage.length > 0 &&
                             !errorMessage.includes('Error') &&
                             (errorMessage.includes('api_endpoint') ||
                              errorMessage.includes('missing') ||
                              errorMessage.includes('required'));

    assert(
      hasSpecificReason,
      'Deploy failure must surface specific reason, not return vague error message'
    );
  }
};
