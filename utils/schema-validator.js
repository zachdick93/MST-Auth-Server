const Ajv = require('ajv')
const ajv = new Ajv()

const apiKeySchema = {
  type: 'object',
  properties: {
    apiKey: { type: 'string' }
  },
  required: ['apiKey'],
  additionalProperties: false
}
const validateAPIKey = ajv.compile(apiKeySchema)

const publicKeySchema = {
  type: 'object',
  properties: {
    publicKey: { type: 'string' }
  },
  required: ['publicKey'],
  additionalProperties: false
}
const validatePublicKey = ajv.compile(publicKeySchema)

const microserviceSchema = {
  type: 'object',
  properties: {
    microserviceName: { type: 'string' },
    maxReplicas: { type: 'integer' },
    encryption: { type: 'string' },
    uri: { type: 'string' },
    authorizationList: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          microserviceName: { type: 'string' },
          authorizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                SEND: { type: 'array', items: { type: 'string' } },
                RECEIVE: { type: 'array', items: { type: 'string' } },
                FORWARD: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  },
  additionalProperties: false
}

const validateMicroservice = ajv.compile(microserviceSchema)

const eventSchemaObj = {
  type: 'object',
  properties: {
    event: {
      type: 'object',
      properties: {
        root_msgid: { type: 'string' },
        msgid: { type: 'string' },
        create_timestamp: { type: 'string' },
        parent_msgid: { type: 'string' },
        sending_instanceid: { type: 'string' },
        sending_serviceid: { type: 'string' },
        sending_servicename: { type: 'string' },
        receiving_instanceid: { type: 'string' },
        receiving_serviceid: { type: 'string' },
        receiving_servicename: { type: 'string' },
        body_hash: { type: 'string' },
        reason_code: { type: 'integer' }
      }
    }
  },
  additionalProperties: false
}

const eventSchemaStr = {
  type: 'object',
  properties: {
    event: {
      type: 'string'
    }
  },
  additionalProperties: false
}

const validateEventDataObj = ajv.compile(eventSchemaObj)
const validateEventDataStr = ajv.compile(eventSchemaStr)

module.exports = {
  validateAPIKey,
  validatePublicKey,
  validateMicroservice,
  validateEventDataObj,
  validateEventDataStr
}
