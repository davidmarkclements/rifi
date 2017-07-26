'use strict'

const upring = require('upring')
const sync = require('rifi-sync')
const create = {
  exports: require('rifi-exports'),
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
  const peer = opts.peer || createPeer(opts)
  peer.logger.level = opts.logLevel || 'info'

  const logger = peer.logger.child({MODULE})

  const store = new Map()

  const exports = create.exports(peer, store)
  const load = create.load(peer, store)
  const bundle = create.bundle(peer, store)
  const render = create.render(peer, store)
  const close = (cb) => peer.ready(() => peer.close(cb))
  sync(peer, store)

  return { logger, peer, store, exports, load, bundle, render, close }
}

function createPeer (opts) {
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
    config.hashring.port = config.hashring.port || opts.port
  }
  return upring(config)
}
