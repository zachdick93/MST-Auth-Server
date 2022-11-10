const dbClient = require('./utils/cassandra-client')

async function processEventData (ws, msg) {
  // TODO: Check for anomolies and save audit data
  console.log('processEventData')
  await dbClient.saveTraceData(msg.event)
}

module.exports = {
  processEventData
}
