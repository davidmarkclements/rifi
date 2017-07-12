'use strict'

const MODULE = 'rifi-sync'
const NS='rifi'

module.exports = rifiSync 

function rifiSync(peer, cache) {
  if (peer.isReady === false) {
    peer.once('up', () => rifiSync(peer, cache))
    return
  }

  peer.add('ns:rifi,cmd:ls', (req, reply) => {
    const logger = peer.logger.child({MODULE})
    logger.debug('supplying list of components for this peer')
    reply(null, {ok: true, components: Array.from(cache.keys())})
  })

  peer.add('ns:rifi,cmd:replicate', (req, reply) => {
    const {name, deps} = req
    const logger = peer.logger.child({MODULE, component: name})
    logger.debug(`adding deps for ${name} component`)
    logger.trace({name, deps}, `adding deps for ${name} component`)

    cache.set(name, deps)
    reply(null, {ok: true, status: 'replicated'})
  })

  peer.add('ns:rifi,cmd:upload', (req, reply) => {
    const {key, ns, cmd, name, deps} = req
    const logger = peer.logger.child({MODULE, component: name})
    logger.debug(`adding deps for ${name} component`)
    logger.trace({name, deps}, `adding deps for ${name} component`)
    cache.set(name, deps)
    const nextPeer = peer._hashring.next(key)
    if (nextPeer === null) {
      logger.warn('no peers to replicate to!')
      return void reply(null, {ok: true, status: 'uploaded-not-replicated'})
    }
    
    peer.peerConn(nextPeer).request({
      ns,
      cmd: 'replicate',
      name,
      deps 
    }, (err, result) => {
      if (err) {
        logger.warn(err, 'unable to replicate!')
        return void reply(null, {ok: true, status: 'uploaded-not-replicated'})
      }
      reply(null, {ok: true, status: 'uploaded-and-replicated'})
    })    
  })

  peer.add('ns:rifi,cmd:load', (req, reply) => {
    const {key, ns, cmd, name, deps} = req
    const logger = peer.logger.child({MODULE, component: name})
    if (cache.has(name) === false) {
      const whoami = peer.whoami()
      const _peerTrace = req._peerTrace || []
      _peerTrace.push(peer.whoami())
      const nextPeer = peer._hashring.next(key, _peerTrace)
      if (nextPeer === null) {
        logger.warn(`cannot locate deps for ${name} in hashring`)
        reply(Error(`${name} not found`))
        return
      }
      logger.debug(`no deps for ${name} on ${whoami}, trying next peer ${nextPeer.id}`)
      peer.peerConn(nextPeer).request({key, ns, cmd, name, deps, _peerTrace}, (err, result) => {
        if (err) {
          logger.error(err, 'proxy request to next peer attempt failed')
          reply(err)
          return
        }
        reply(null, result)
      })
      return
    }
    reply(null, {name, deps: cache.get(name)})
  })
}