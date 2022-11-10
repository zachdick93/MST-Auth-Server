const generator = require('generate-password')

function generateKeystorePassword () {
  return generator.generate({
    length: 25,
    numbers: true
  })
}

module.exports = {
  generateKeystorePassword
}
