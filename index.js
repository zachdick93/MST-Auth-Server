const regManager = require('./registration-manager')
const eventHandler = require('./anomaly-detector')
const schemaValidator = require('./utils/schema-validator')
const { generateKeystorePassword } = require('./utils/generate-password')
// const https = require('https') // https://adamtheautomator.com/https-nodejs/
// const fs = require('fs')
const express = require('express') // https://www.npmjs.com/package/express
const expressWs = require('express-ws') // https://www.npmjs.com/package/express-ws
const app = express()
// const server = https
//   .createServer({
//     key: fs.readFileSync('./privacy/key.pem'),
//     cert: fs.readFileSync('./privacy/cert.pem')
//   },
//   app)

const wss = expressWs(app) // , server)

app.listen(4000, () => {
  console.log('server is runing at port 4000')
})

app.use(function (req, res, next) {
  if (req.headers['x-api-key'] || req.headers.connection === 'Upgrade') {
    req.testing = 'testing'
    return next()
  } else if (req.url === '/apikeys' || req.url === '/microservice') {
    return next()
  } else {
    console.log('request failed')
    console.log(`url ${req.url}`)
    res.status(400).send('Bad Request').end()
  }
})

app.use(express.json())

// get keystore password (Build Step)
app.get('/keystore-password', async function (req, res, next) {
  try {
    if (req.headers['x-api-key'].includes('build')) {
      const body = {
        keystorePassword: generateKeystorePassword()
      }
      await regManager.storeKeystorePassword(req.headers['x-api-key'], body.keystorePassword)
      res.send(body)
      res.end()
    } else {
      res.status(401).send('Unauthorized').end()
    }
  } catch (error) {
    console.log(`Error in /keystore-password: ${error.message}`)
    res.status(500).send('Unexpected Error').end()
  }
})
// put public key (Build Step)
app.put('/public-key', async function (req, res, next) {
  try {
    if (req.headers['x-api-key'].includes('build')) {
      if (schemaValidator.validatePublicKey(req.body)) {
        await regManager.storePublicKey(req.headers['x-api-key'], req.body.publicKey)
        res.status(201).end()
      } else {
        res.status(400).send('Bad Request').end()
      }
    } else {
      res.status(401).send('Unauthorized').end()
    }
  } catch (error) {
    console.log(`Error in /public-key: ${error.message}`)
    res.status(500).send('Unexpected Error').end()
  }
})

// Post Microservice Data (Test Endpoint)
app.post('/microservice', async function (req, res, next) {
  try {
    console.log('post microservice')
    if (schemaValidator.validateMicroservice(req.body)) {
      const body = await regManager.storeMicroserviceData(req.body)
      res.status(201).send(body).end()
    } else {
      res.status(400).send('Bad Request').end()
    }
  } catch (error) {
    console.log(`Error in /microservice: ${error.message}`)
    res.status(500).send('Unexpected Error').end()
  }
})

// Websocket Server (Deploy Step)
app.ws('/wss', function (ws, req) {
  ws.on('message', async (msg) => {
    try {
      console.log(msg)
      msg = JSON.parse(msg)
      if (schemaValidator.validateAPIKey(msg)) {
        const serviceData = await regManager.validateWebsocket(ws, msg.apiKey)
        const data = await regManager.getInitDataForWS(ws, serviceData)
        const sockets = wss.getWss().clients
        ws.send(JSON.stringify(data))

        const microserviceIds = data.authorizationList.map(authObject => authObject.microserviceId)
        sockets.forEach(socket => {
          if (socket.validated && microserviceIds.includes(socket.microserviceId)) {
            const update = {
              action: 'add_instance',
              instanceId: data.instanceId,
              microserviceId: data.microserviceId,
              microserviceName: data.microserviceName
            }
            socket.send(JSON.stringify(update))
          }
        })
      } else if (ws.validated === true) {
        if (schemaValidator.validateEventData(msg)) {
          console.log('validated event data')
          await eventHandler.processEventData(ws, msg)
          ws.send(JSON.stringify({ response: 'ACK', reason: 'success' }))
        } else {
          console.log('invalid event data: %s', msg)
          ws.send(JSON.stringify({ response: 'NACK', reason: 'invalid data' }))
        }
      } else {
        throw new Error('invalid message!')
      }
    } catch (error) {
      console.log(`Error: ${error.message}`)
      ws.close()
    }
  })
  ws.on('close', async (code) => {
    console.log(`client disconnect: instance ${ws.instanceId}`)
    const sockets = wss.getWss().clients
    const data = await regManager.getMicroservicesAuthData(await regManager.deregisterInstance(ws))
    const microserviceIds = data.authorizationList.map(authObject => authObject.microserviceId)
    sockets.forEach(socket => {
      if (socket.validated && microserviceIds.includes(socket.microserviceId)) {
        const update = {
          action: 'drop_instance',
          instanceId: ws.instanceId,
          microserviceId: ws.microserviceId,
          microserviceName: ws.microserviceName
        }
        socket.send(JSON.stringify(update))
      }
    })
  })

  ws.on('ping', (msg) => {
    console.log('pinged')
    ws.pong(msg)
  })

  ws.onerror = () => {
    console.log('an error occured')
  }

  console.log('socket', req.testing)
  regManager.newWsConnected(ws)
})
