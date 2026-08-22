const { assert } = require('./assert');

module.exports = {
  'd1-database-not-created-when-no-auth': () => {
    // This function should exist but doesn't yet
    const { analyzeDeploymentRequirements } = require('../lib/deployment-analyzer');

    const dataPackage = {
      project_id: 'proj-111',
      features: [
        'landing_page',
        'product_showcase',
        'contact_form'
      ],
      requires_authentication: false,  // Explicitly no login needed
      requires_database: false  // No data persistence needed
    };

    const deploymentPlan = analyzeDeploymentRequirements(dataPackage);

    // When auth is not needed, D1 database should NOT be in deployment plan
    const includesD1 = deploymentPlan.resources &&
                      deploymentPlan.resources.some(r => r.type === 'D1' || r.includes('D1'));

    assert(
      !includesD1,
      'D1 database should not be created when login functionality is not required'
    );
  }
};
