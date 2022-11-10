// docker run --name some-cassandra -v /my/own/datadir:/var/lib/cassandra -d cassandra:tag
// const cassandra = require('cassandra-driver')

// const client = new cassandra.Client({
//   contactPoints: ['h1', 'h2'],
//   localDataCenter: 'datacenter1',
//   keyspace: 'ks1'
// })

// const createTableQuery = 'CREATE TABLE IF NOT EXISTS  mstauth.service_tree (
//   root_msgid UUID,
//   msgid UUID,
//   create_timestamp timestamp,
//   parent_msgid UUID,
//   sending_instanceid UUID,
//   sending_serviceid UUID,
//   sending_servicename TEXT,
//   receiving_instanceid UUID,
//   receiving_serviceid UUID,
//   receiving_servicename TEXT,
//   PRIMARY KEY ((root_msgid), parent_msgid, msgid, create_timestamp));

async function saveTraceData (msg) {
  console.log(`saveTraceData: ${JSON.stringify(msg)}`)
}

module.exports = {
  saveTraceData
}
