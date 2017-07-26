'use strict'

const { test } = require('tap')
const pino = require('pino')
const proxyquire = require('proxyquire').noPreserveCache()
const noopStubs = {}

// todo - do actual pattern equality check - parse etc.
function unmatch (ptn, to) {
  return ptn !== to
}

test('exports a function', ({is, end}) => {
  const rifiSync = proxyquire('..', {})
  is(typeof rifiSync, 'function')
  end()
})

test('waits until peer is ready', ({is, pass, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  var done = false
  const peer = {
    logger,
    isReady: false,
    once: (evt, cb) => {
      is(evt, 'up')
      peer.isReady = true
      cb()
    },
    add: () => {
      if (done) return
      done = true
      pass('responded to peer ready')
      end()
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:ls pattern-route on peer', ({is, pass, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    add: (ptn) => {
      if (unmatch(ptn, 'ns:rifi,cmd:ls')) return
      pass('ns:rifi,cmd:ls')
      end()
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:ls handler spawns child logger with bound MODULE key', ({is, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE}) {
      is(MODULE, 'rifi-sync')
      end()
      return this
    }
  }

  const peer = {
    logger,
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:ls')) return
      handler({}, () => {})
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:ls handler responds with list of component names in local store', ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:ls')) return
      handler({}, (err, {ok, components}) => {
        if (err) throw err
        is(ok, true)
        same(components, ['test'])
        end()
      })
    }
  }
  const store = new Map()
  store.set('test', [])
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:replicate pattern-route on peer', ({is, pass, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    add: (ptn) => {
      if (unmatch(ptn, 'ns:rifi,cmd:replicate')) return
      pass('ns:rifi,cmd:replicate')
      end()
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:replicate handler spawns child logger with bound MODULE, component keys', ({is, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      is(MODULE, 'rifi-sync')
      is(component, 'test')
      end()
      return this
    }
  }

  const peer = {
    logger,
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:replicate')) return
      handler({name: 'test'}, () => {})
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:replicate handler adds supplied deps to store as per name', ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:replicate')) return
      handler({name: 'test', deps: test}, (err) => {
        if (err) throw err
        is(store.get('test'), test)
        end()
      })
    }
  }
  const test = []
  const store = new Map()
  rifiSync(peer, store)
})

test(`ns:rifi,cmd:replicate handler responds with {ok: true, status: 'replicated'}`, ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:replicate')) return
      handler({name: 'test', deps: test}, (err, {ok, status}) => {
        if (err) throw err
        is(ok, true)
        is(status, 'replicated')
        end()
      })
    }
  }
  const test = []
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:upload pattern-route on peer', ({is, pass, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    add: (ptn) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      pass('ns:rifi,cmd:upload')
      end()
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:upload handler spawns child logger with bound MODULE, component keys', ({is, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      is(MODULE, 'rifi-sync')
      is(component, 'test')
      end()
      return this
    }
  }

  const peer = {
    logger,
    _hashring: {next: () => {}},
    peerConn: () => ({request: () => {}}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test'}, () => {})
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:upload handler adds supplied deps to store as per name', ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => {}},
    peerConn: () => ({request: () => {}}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test', deps: test}, (err) => {
        if (err) throw err
      })
      is(store.get('test'), test)
      end()
    }
  }
  const test = []
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:upload handler responds with uploaded-not-replicated status if there is no next peer', ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => null}, // <- simulate no next peer
    peerConn: () => ({request: () => {}}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test', deps: test}, (err, {ok, status}) => {
        is(err, null)
        is(ok, true)
        is(status, 'uploaded-not-replicated')
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:upload handler responds with uploaded-not-replicated status if there is no next peer', ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const test = []
  const peer = {
    logger,
    _hashring: {next: () => null}, // <- simulate no next peer
    peerConn: () => ({request: () => {}}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test', deps: test}, (err, {ok, status}) => {
        is(err, null)
        is(ok, true)
        is(status, 'uploaded-not-replicated')
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test(`ns:rifi,cmd:upload makes a request of the next peer with pattern {ns,cmd: 'replicate',name,deps}`, ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const test = []
  const peer = {
    logger,
    _hashring: {next: () => ({})}, // <- simulate no next peer
    peerConn: () => ({request: ({ns, cmd, name, deps}) => {
      is(ns, 'rifi')
      is(cmd, 'replicate')
      is(name, 'test')
      is(deps, test)
      end()
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test', deps: test, ns: 'rifi'}, (err) => {
        if (err) throw err
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test(`ns:rifi,cmd:upload responds with uploaded-not-replicated status if request to next peer fails`, ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const test = []
  const peer = {
    logger,
    _hashring: {next: () => ({})}, // <- simulate no next peer
    peerConn: () => ({request: ({ns, cmd, name, deps}, cb) => {
      cb(Error())
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test', deps: test, ns: 'rifi'}, (err, {ok, status}) => {
        is(err, null)
        is(ok, true)
        is(status, 'uploaded-not-replicated')
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test(`ns:rifi,cmd:upload responds with uploaded-and-replicated status if request to next peer succeeds`, ({is, same, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const test = []
  const peer = {
    logger,
    _hashring: {next: () => ({})},
    peerConn: () => ({request: ({ns, cmd, name, deps}, cb) => {
      cb(null, {})
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:upload')) return
      handler({name: 'test', deps: test, ns: 'rifi'}, (err, {ok, status}) => {
        is(err, null)
        is(ok, true)
        is(status, 'uploaded-and-replicated')
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:load pattern-route on peer', ({is, pass, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => null},
    whoami: () => {},
    add: (ptn) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      pass('ns:rifi,cmd:load')
      end()
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('ns:rifi,cmd:load handler spawns child logger with bound MODULE, component keys', ({is, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      is(MODULE, 'rifi-sync')
      is(component, 'test')
      end()
      return this
    }
  }

  const peer = {
    logger,
    _hashring: {next: () => null},
    whoami: () => {},
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({name: 'test'}, () => {})
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:load loads deps from local store when available', ({is, pass, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => null},
    whoami: () => {},
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({name: 'test'}, (err, {name, deps}) => {
        if (err) throw err
        is(name, 'test')
        is(deps, test)
        end()
      })
    }
  }
  const store = new Map()
  const test = []
  store.set('test', test)
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:load if deps not found locally or among peers, responds with Error {name} not found', ({is, ok, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => null},
    whoami: () => {},
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({name: 'test'}, (err) => {
        ok(err)
        is(err.message, `test not found`)
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:load request deps from next peer if not found in local store', ({is, ok, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => ({})},
    whoami: () => {},
    peerConn: () => ({request: ({key, ns, cmd, name, _peerTrace}) => {
      is(key, 'test')
      is(cmd, 'load')
      is(ns, 'rifi')
      is(name, 'test')
      ok(Array.isArray(_peerTrace))
      end()
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({key: 'test', name: 'test', ns: 'rifi', cmd: 'load'}, (err) => {
        if (err) throw err
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

// note - what we actually should do is find the next peer if peer request fails
test('registers ns:rifi,cmd:load propagates error if peer request fails', ({is, ok, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: () => ({})},
    whoami: () => {},
    peerConn: () => ({request: (o, cb) => {
      cb(Error('test'))
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({key: 'test', name: 'test', ns: 'rifi', cmd: 'load'}, (err) => {
        ok(err)
        is(err.message, 'test')
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:load replies with peer request result', ({is, ok, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const test = {}
  const peer = {
    logger,
    _hashring: {next: () => ({})},
    whoami: () => {},
    peerConn: () => ({request: (o, cb) => {
      cb(null, test)
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({key: 'test', name: 'test', ns: 'rifi', cmd: 'load'}, (err, result) => {
        if (err) throw err
        is(result, test)
        end()
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})

test('registers ns:rifi,cmd:load keeps a list of visited peers which are passed to peer._hashring.next as a filter (circuit breaking)', ({is, ok, end}) => {
  const rifiSync = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})

  const peer = {
    logger,
    _hashring: {next: (k, peerTrace) => {
      is(peerTrace[0], 'testid')
      return {id: 'testid'}
    }},
    whoami: () => 'testid',
    peerConn: () => ({request: ({key, ns, cmd, name, _peerTrace}) => {
      is(_peerTrace[0], 'testid')
      end()
    }}),
    add: (ptn, handler) => {
      if (unmatch(ptn, 'ns:rifi,cmd:load')) return
      handler({key: 'test', name: 'test', ns: 'rifi', cmd: 'load'}, (err) => {
        if (err) throw err
      })
    }
  }
  const store = new Map()
  rifiSync(peer, store)
})
