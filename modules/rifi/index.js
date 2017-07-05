'use strict'

const upring = require('upring')
const sync = require('rifi-sync')
const create = {
  component: require('rifi-component'),
  load: require('rifi-load'),
  bundle: require('rifi-bundle'),
  render: require('rifi-render')
}

const MODULE = 'rifi'

module.exports = rifi

rifi.app = (opts = {}) => {
  opts.client = true
  return rifi(opts)
}

function rifi (opts = {}) {

  const config = {
    logger: opts.logger,
    client: opts.client 
  }
  if (opts.join) {
    config.base = opts.join
  }
  if (opts.port) {
    config.port = opts.port 
    config.hashring = {port: opts.port}
  }
  const peer = upring(config)
  peer.logger.level = opts.logLevel || 'info'

  const logger = peer.logger.child({MODULE})

  const cache = new Map()

  const component = create.component(peer, cache)
  const view = component
  const head = component
  const load = create.load(peer, cache)
  const bundle = create.bundle(peer, cache)
  const render = create.render(peer, cache)
  sync(peer, cache)
  
  return {
    logger,
    peer,
    view,
    head,
    component,
    load,
    bundle,
    render
  }
}