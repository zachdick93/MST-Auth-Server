const { v4: uuidv4 } = require('uuid')
const redisClient = require('./utils/redis-client')
const apiKeyGen = require('./utils/generate-apikey')

function newWsConnected (ws) {
  console.log('newWsConnected')
  ws.validated = false
};

async function validateWebsocket (ws, apiKey) {
  console.log('validateWebsocket')
  try {
    const microserviceId = await redisClient.getMicroserviceId(apiKey)
    const serviceData = await redisClient.getMicroserviceData(microserviceId)
    serviceData.instanceCount += 1
    if (validateReplicaCount(serviceData) === true) {
      ws.microserviceId = microserviceId
      ws.validated = true
      ws.microserviceName = serviceData.microserviceName
      ws.instanceId = generateUniqueId()
      serviceData.instanceList.push(ws.instanceId)
      await redisClient.setMicroserviceData(microserviceId, serviceData)
    } else {
      throw new Error('Replica max reached')
    }

    return serviceData
  } catch (error) {
    console.log(`Error: ${error.message}`)
    throw error
  }
};

function validateReplicaCount (serviceData) {
  return serviceData.instanceCount <= serviceData.maxReplicas
}

function generateUniqueId () {
  return uuidv4()
}

async function getInitDataForWS (ws, serviceData) {
  console.log('getInitDataForWS')
  serviceData = await getMicroservicesAuthData(serviceData)
  const authData = {
    microserviceId: ws.microserviceId,
    instanceId: ws.instanceId,
    microserviceName: serviceData.microserviceName,
    authorizationList: serviceData.authorizationList
  }

  return authData
}

async function deregisterInstance (ws) {
  console.log('deregisterInstance')
  const data = await redisClient.getMicroserviceData(ws.microserviceId)
  data.instanceCount -= 1
  data.instanceList = data.instanceList.filter((value) => {
    return value !== ws.instanceId
  })
  await redisClient.setMicroserviceData(ws.microserviceId, data)
  return data
}

async function storeKeystorePassword (apiKey, password) {
  console.log('storeKeystorePassword')
  const serviceId = await redisClient.getMicroserviceId(apiKey)
  const data = await redisClient.getMicroserviceData(serviceId)
  data.keystorePassword = password
  await redisClient.setMicroserviceData(serviceId, data)
}

async function storePublicKey (apiKey, publicKey) {
  console.log('storePublicKey')
  const serviceId = await redisClient.getMicroserviceId(apiKey)
  const data = await redisClient.getMicroserviceData(serviceId)
  data.publicKey = publicKey
  await redisClient.setMicroserviceData(serviceId, data)
}

async function storeMicroserviceData (data) {
  console.log('storeMicroserviceData')
  const microserviceId = generateUniqueId()
  const buildKey = apiKeyGen.generateBuildApiKey()
  const deploymentKey = apiKeyGen.generateDeployApiKey()
  await redisClient.setKeyServicePair(buildKey, microserviceId)
  await redisClient.setKeyServicePair(deploymentKey, microserviceId)
  await redisClient.setNameAndIdPair(data.microserviceName, microserviceId)
  data.microserviceId = microserviceId
  data.instanceCount = 0
  data.instanceList = []
  await redisClient.setMicroserviceData(microserviceId, data)
  return {
    buildKey,
    deploymentKey,
    microserviceId
  }
}

async function getMicroservicesAuthData (data) {
  console.log('getMicroserviceAuthData')
  const updatedList = await Promise.all(data.authorizationList.map(async item => {
    item.microserviceId = await redisClient.getMicroserviceId(item.microserviceName)
    if (item.microserviceId) {
      const serviceData = await redisClient.getMicroserviceData(item.microserviceId)
      item.publicKey = serviceData.publicKey
      item.instanceList = serviceData.instanceList
    }
    return item
  }))
  data.authorizationList = updatedList
  return data
}

module.exports = {
  newWsConnected,
  validateWebsocket,
  getInitDataForWS,
  deregisterInstance,
  storeKeystorePassword,
  storePublicKey,
  storeMicroserviceData,
  getMicroservicesAuthData
}
