const superagent = require('superagent') // https://github.com/visionmedia/superagent
const WebSocket = require('ws')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const hostAddress = 'localhost:4000' // 'ec2-54-205-101-105.compute-1.amazonaws.com'
const microservices = [
  {
    microserviceName: 'MSTAGateway',
    maxReplicas: 1,
    uri: 'http://mstauth-env.eba-zgvgmydp.us-east-2.elasticbeanstalk.com/MSTA-Gateway/MSTAGateway.html',
    authorizationList: [
      {
        microserviceName: 'MSTABusiness',
        encryption: 'NONE',
        authorizations: { FORWARD: ['GET', 'PUT', 'POST'] }
      }
    ]
  },
  {
    microserviceName: 'MSTABusiness',
    maxReplicas: 1,
    uri: 'http://mstauth-env.eba-zgvgmydp.us-east-2.elasticbeanstalk.com/MSTA-BusinessService/MSTABusiness.html',
    authorizationList: [
      {
        microserviceName: 'MSTAAuthorization',
        encryption: 'NONE',
        authorizations: { FORWARD: ['GET', 'PUT', 'POST'] }
      },
      {
        microserviceName: 'MSTADataProvider',
        encryption: 'NONE',
        authorizations: { FORWARD: ['GET', 'PUT', 'POST'] }
      },
      {
        microserviceName: 'MSTAGateway',
        encryption: 'NONE',
        authorizations: { RECEIVE: ['GET', 'PUT', 'POST'] }
      }
    ]
  },
  {
    microserviceName: 'MSTAAuthorization',
    maxReplicas: 1,
    uri: 'http://mstauth-env.eba-zgvgmydp.us-east-2.elasticbeanstalk.com/MSTA-AuthorizationService/MSTAAuthorization.html',
    authorizationList: [
      {
        microserviceName: 'MSTABusiness',
        encryption: 'NONE',
        authorizations: { RECEIEVE: ['GET', 'PUT', 'POST'] }
      }
    ]
  },
  {
    microserviceName: 'MSTADataProvider',
    maxReplicas: 1,
    uri: 'http://mstauth-env.eba-zgvgmydp.us-east-2.elasticbeanstalk.com/MSTA-DataProvider/MSTADataProvider.html',
    authorizationList: [
      {
        microserviceName: 'MSTABusiness',
        encryption: 'NONE',
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
    .post(`https://${hostAddress}/microservice`)
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
          .get(`https://${hostAddress}/keystore-password`)
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
                .put(`https://${hostAddress}/public-key`)
                .set('X-API-Key', buildKey)
                .set('accept', 'json')
                .send({ publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiuTNhwvX2F1C3GugI1bFTTGQSx/yROTckkQIwuoaIHJsbx688di9akGjDRNvA8rL/S1Clkkil95LAlSDWTq/PvfTbpfJ7U6P745Xo3lYRGwpkjqR77FCi+17F9g5EdCTvNzMsoNcqDPF93lrQwKTUbMswLiSVlAUlr/IcWEt7PI2dl0HzOQu5meAniC0J5BOPImxEtInaePgDgOxGofk185k/NjPGqURfvc+IMfgllpcBZlj2novrFDHilcEjEb4aWeUsUL3vVAG6Hxacze2WpaQ2l3vtmvlSMJEwG4H0PWZ1uY4rpgx4RZbTSgqwiX/m+8+tFRvdot9G3dHZ6FQJwIDAQAB' })
                .end((err, res) => {
                  if (err) {
                    console.log(err.message)
                  } else {
                    console.log(res.statusCode)
                    console.log(res.body)
                    const ws = new WebSocket(`wss://${hostAddress}/wss`)

                    ws.on('open', function open () {
                      ws.send(JSON.stringify({ apiKey: deployKey }))
                    })

                    ws.on('message', function message (data) {
                      if (JSON.parse(data).response !== 'ACK') {
                        // Add function to process messages
                        console.log('received: %s', data)
                        ws.send(JSON.stringify(eventMsg))
                        setTimeout(() => {
                          ws.close()
                        }, ms)
                      }
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

connectService(microservices[0], 5000)
connectService(microservices[1], 10000)
connectService(microservices[2], 15000)
connectService(microservices[3], 20000)
