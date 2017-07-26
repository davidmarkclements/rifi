'use strict'

const pack = require('browser-pack')

const create = {
  load: require('rifi-load')
}

const MODULE = 'rifi-bundle'

module.exports = rifiBundle

function rifiBundle (peer, store) {
  return function bundle (name, cb) {
    const logger = peer.logger.child({MODULE, component: name})

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => bundle(name, cb))
      return
    }

    const load = create.load(peer, store)
    logger.debug('loading component so it can be bundled')
    load(name, (err, deps) => {
      if (err) {
        logger.error(err, 'error getting component dependencies')
        return void cb(err)
      }
      logger.debug('transforming dependencies into bundle')
      const head = deps[deps.length - 1].id
      const packer = pack({
        raw: true,
        standalone: head,
        standaloneModule: head
      })
      cb(null, packer)
      deps.forEach((dep) => {
        packer.write(dep)
      })
      packer.end()
    })
  }
}
