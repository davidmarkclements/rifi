'use strict'

const MODULE = 'rifi-sync'

module.exports = rifiSync 

function rifiSync(peer, cache) {
  if (peer.isReady === false) {
    peer.once('up', () => rifiSync(peer, cache))
    return
  }

  peer.on('request', function (req, reply) {
    const {key, ns, cmd, name, deps} = req
    if (ns !== 'rifi') return void reply(null, {ok: false, status: 'unsupported'})
    if (name === undefined) {
      if (cmd === 'list-stored-components') {
        return void reply(null, {ok: true, components: Array.from(cache.keys())})
      }
      return void reply(null, {ok: false, status: 'need a name'})
    }
    const logger = peer.logger.child({MODULE, component: name})

    logger.debug(req, `${peer.whoami()} received request`)

    if (cmd === 'upload' || cmd === 'replicate') {
      logger.debug({name, deps}, `adding deps for ${name} component`)
      cache.set(name, deps)

      if (cmd === 'replicate') {
        return void reply(null, {ok: true, status: 'replicated'})
      }

      if (cmd === 'upload') {
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
      }
      return
    }
    

    if (cmd === 'load') {
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
    }
  })
}
