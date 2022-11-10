const superagent = require('superagent') // https://github.com/visionmedia/superagent
const WebSocket = require('ws')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
// callback
// superagent
//   .put('https://localhost:4000/')
//   .send({ name: 'Manny', species: 'cat' }) // sends a JSON post body
//   .set('X-API-Key', 'foobar')
//   .set('accept', 'json')
//   .end((err, res) => {
//     // Calling the end function will send the request
//     if (err) {
//       console.log(err.message)
//     } else {
//       console.log(res.statusCode)
//       console.log(res.body)
//     }
//   })

const microservices = [
  {
    microserviceName: 'testMicroservice',
    maxReplicas: 3,
    encryption: 'HEADER',
    authorizationList: [
      {
        microserviceName: 'MSTAGateway',
        authorizations: { RECEIVE: ['GET', 'PUT', 'POST'] }
      },
      {
        microserviceName: 'MSTADataProvider',
        authorizations: { FORWARD: ['GET', 'PUT', 'POST'] }
      }
    ]
  },
  {
    microserviceName: 'MSTAGateway',
    maxReplicas: 2,
    encryption: 'HEADER',
    authorizationList: [
      {
        microserviceName: 'testMicroservice',
        authorizations: { SEND: ['GET', 'PUT', 'POST'] }
      },
      {
        microserviceName: 'MSTADataProvider',
        authorizations: { RECEIVE: ['GET', 'PUT', 'POST'] }
      }
    ]
  },
  {
    microserviceName: 'MSTADataProvider',
    maxReplicas: 2,
    encryption: 'HEADER',
    authorizationList: [
      {
        microserviceName: 'MSTAGateway',
        authorizations: { SEND: ['GET', 'PUT', 'POST'] }
      },
      {
        microserviceName: 'testMicroservice',
        authorizations: { RECEIVE: ['GET', 'PUT', 'POST'] }
      }
    ]
  }
]

const eventMsg = {
  event: {
    root_msgid: 'c1b378be-7983-4441-bf30-aef89ea852a9',
    msgid: 'c1b378be-7983-4441-bf30-aef89ea852a9',
    create_timestamp: '0',
    parent_msgid: 'c1b378be-7983-4441-bf30-aef89ea852a9',
    sending_instanceid: 'c1b378be-7983-4441-bf30-aef89ea852a9',
    sending_serviceid: 'c1b378be-7983-4441-bf30-aef89ea852a9',
    sending_servicename: 'MSTAGateway',
    receiving_instanceid: 'f2b38d5d-ee7f-4f14-afd7-2662aeacb412',
    receiving_serviceid: 'f2b38d5d-ee7f-4f14-afd7-2662aeacb412',
    receiving_servicename: 'MSTADataProvider',
    reason_code: 200
  }
}

function connectService (microservice, ms) {
  let buildKey = ''
  let deployKey = ''
  superagent
    .post('https://localhost:4000/microservice')
    .set('accept', 'json')
    .send(microservice)
    .end((err, res) => {
      // Calling the end function will send the request
      if (err) {
        console.log(err.message)
      } else {
        console.log(res.statusCode)
        console.log(res.body)
        console.log('get password')
        buildKey = res.body.buildKey
        deployKey = res.body.deploymentKey
        superagent
          .get('https://localhost:4000/keystore-password')
          .set('X-API-Key', buildKey)
          .set('accept', 'json')
          .end((err, res) => {
            // Calling the end function will send the request
            if (err) {
              console.log(err.message)
            } else {
              console.log(res.statusCode)
              console.log(res.body)
              console.log('put publickey')
              superagent
                .put('https://localhost:4000/public-key')
                .set('X-API-Key', buildKey)
                .set('accept', 'json')
                .send({ publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiuTNhwvX2F1C3GugI1bFTTGQSx/yROTckkQIwuoaIHJsbx688di9akGjDRNvA8rL/S1Clkkil95LAlSDWTq/PvfTbpfJ7U6P745Xo3lYRGwpkjqR77FCi+17F9g5EdCTvNzMsoNcqDPF93lrQwKTUbMswLiSVlAUlr/IcWEt7PI2dl0HzOQu5meAniC0J5BOPImxEtInaePgDgOxGofk185k/NjPGqURfvc+IMfgllpcBZlj2novrFDHilcEjEb4aWeUsUL3vVAG6Hxacze2WpaQ2l3vtmvlSMJEwG4H0PWZ1uY4rpgx4RZbTSgqwiX/m+8+tFRvdot9G3dHZ6FQJwIDAQAB' })
                .end((err, res) => {
                  if (err) {
                    console.log(err.message)
                  } else {
                    console.log(res.statusCode)
                    console.log(res.body)
                    const ws = new WebSocket('wss://localhost:4000/wss')

                    ws.on('open', function open () {
                      ws.send(JSON.stringify({ apiKey: deployKey }))
                    })

                    ws.on('message', function message (data) {
                      // Add function to process messages
                      console.log('received: %s', data)
                      ws.send(JSON.stringify(eventMsg))
                      setTimeout(() => {
                        ws.close()
                      }, ms)
                    })

                    ws.on('error', function error (err) {
                      // add function to process errors
                      console.log('err: %s', err)
                    })

                    ws.on('close', () => {
                      console.log('closed')
                    })

                    ws.on('pong', () => {
                      console.log('pong')
                    })
                  }
                })
            }
          })
      }
    })
}

connectService(microservices[0], 3000)
connectService(microservices[1], 6000)
connectService(microservices[2], 10000)
