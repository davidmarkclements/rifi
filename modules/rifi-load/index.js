'use strict'

const MODULE = 'rifi-load'

module.exports = rifiLoad

function rifiLoad (peer, cache) {
  return function load (name, cb) {
    const logger = peer.logger.child({MODULE, component: name})

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => load(name, cb))
      return
    }

    const ptn = {
      key: name,
      ns: 'rifi',
      cmd: 'load',
      name: name
    }

    logger.debug(ptn, `making component request for ${name}`)

    if (cache.has(name)) {
      logger.debug(`found component in local cache (${name})`)
      cb(null, cache.get(name))
      return
    }

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

      logger.debug(`got component response for ${name}`)
      logger.trace(result, `got component response for ${name}`)

      cb(null, result && result.deps)
    })
  }
}
