const { generateApiKey } = require('generate-api-key')

function generateDeployApiKey () {
  return generateApiKey({ method: 'string', prefix: 'deploy', length: 20 })
}

function generateBuildApiKey () {
  return generateApiKey({ method: 'string', prefix: 'build', length: 20 })
}

module.exports = {
  generateDeployApiKey,
  generateBuildApiKey
}
