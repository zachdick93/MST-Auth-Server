// Start Redis with: docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
const Redis = require('ioredis')

const redis = new Redis({
  port: 6379, // Redis port
  host: '127.0.0.1', // Redis host
  // username: "mst-auth-server", // needs Redis >= 6
  // password: "password",
  db: 0 // Defaults to 0
})

// API Key or Service Name
async function getMicroserviceId (key) {
  return redis.get(key)
}

async function getMicroserviceData (microserviceId) {
  return JSON.parse(await redis.get(microserviceId))
}

async function setMicroserviceData (microserviceId, data) {
  await redis.set(microserviceId, JSON.stringify(data))
}

async function setKeyServicePair (key, microserviceId) {
  await redis.set(key, microserviceId)
}

async function setNameAndIdPair (name, id) {
  await redis.set(name, id)
}

module.exports = {
  getMicroserviceId,
  getMicroserviceData,
  setMicroserviceData,
  setKeyServicePair,
  setNameAndIdPair
}
