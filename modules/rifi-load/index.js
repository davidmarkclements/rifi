'use strict'

const MODULE = 'rifi-load'

module.exports = rifiLoad

function rifiLoad (peer, store) {
  return function load (name, cb) {
    const logger = peer.logger.child({MODULE, component: name})

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => load(name, cb))
      return
    }

    if (store.has(name)) {
      logger.debug(`found dependency in local store (${name})`)
      cb(null, store.get(name))
      return
    }

    const ptn = {
      key: name,
      ns: 'rifi',
      cmd: 'load',
      name: name
    }

    logger.debug(ptn, `making dependency request for ${name}`)

    peer.request(ptn, (err, result) => {
      if (err) {
        const { stack } = err
        const type = 'error'
        const { key, ns, cmd, name } = ptn
        logger.error(
          {key, ns, cmd, name, type, stack},
          `problem loading ${name}`,
        ptn)
        cb(err)
        return
      }

      logger.debug(`got dependency response for ${name}`)
      logger.trace(result, `got dependency response for ${name}`)

      cb(null, result && result.deps)
    })
  }
}
