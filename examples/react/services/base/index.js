'use strict'

const rifi = require('rifi')

const base = rifi({
  logLevel: 'debug',
  port: 9999
})

base.peer.once('up', () => {
  console.log(base.peer.whoami())
})
