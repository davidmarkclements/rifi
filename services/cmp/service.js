'use strict'

const { join } = require('path')
const rifi = require('rifi')
const peers = ['192.168.1.111:9999']

const service = rifi({
  join: peers,
  logLevel: 'debug'
})

service.component({
  name: 'cmp',
  main: join(__dirname, 'component') 
})
