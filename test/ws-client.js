const WebSocket = require('ws')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
const ws = new WebSocket('wss://localhost:4000/wss')

ws.on('open', function open () {
  ws.send(JSON.stringify({ apiKey: 'deploy-abcdef12345' }))
})

ws.on('message', function message (data) {
  // Add function to process messages
  console.log('received: %s', data)
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
