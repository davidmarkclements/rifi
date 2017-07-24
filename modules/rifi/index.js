'use strict'

const upring = require('upring')
const sync = require('rifi-sync')
const create = {
  export: require('rifi-export'),
  load: require('rifi-load'),
  bundle: require('rifi-bundle'),
  render: require('rifi-render')
}

const MODULE = 'rifi'

module.exports = rifi

rifi.serve = (opts = {}) => {
  opts.client = true
  return rifi(opts)
}

function rifi (opts = {}) {

  const config = {
    logger: opts.logger,
    client: opts.client,
    hashring: opts.hashring || {}
  }
  if (opts.join) {
    config.base = opts.join
  }
  if (opts.port) {
    config.port = opts.port 
    config.hashring.port = opts.port
  }
  const peer = opts.peer || upring(config)
  peer.logger.level = opts.logLevel || 'info'

  const logger = peer.logger.child({MODULE})

  const store = new Map()

  const _export = create.export(peer, store)
  const load = create.load(peer, store)
  const bundle = create.bundle(peer, store)
  const render = create.render(peer, store)
  sync(peer, store)
  
  return {
    logger,
    peer,
    store,
    export: _export,
    load,
    bundle,
    render
  }
}