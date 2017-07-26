'use strict'

const { join } = require('path')
const { test } = require('tap')
const fs = require('fs')
const through = require('through')
const proxyquire = require('proxyquire')
const pino = require('pino')
const noopStubs = {
  'upring-pubsub': () => through(),
  'rifi-load': () => () => {},
  'module-deps': () => through()
}

test('exports a function', ({is, end}) => {
  const rifiBundle = proxyquire('..', {})
  is(typeof rifiBundle, 'function')
  end()
})

test('returns function', ({is, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const peer = {}
  const store = new Map()
  const exports = rifiExports(peer, store)
  is(typeof exports, 'function')
  end()
})

test('exposes a constants object with { MODULE, RETRY_WAIT, MAX_RETRY }', ({is, ok, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  is(typeof rifiExports.constants, 'object')
  is(rifiExports.constants.MODULE, 'rifi-exports')
  ok(rifiExports.constants.RETRY_WAIT)
  ok(rifiExports.constants.MAX_RETRY)
  end()
})

test('creates upring-pubsub instance if peer does not have pubsub property', ({is, end}) => {
  const stubs = Object.assign({}, noopStubs, {
    'upring-pubsub': ({upring}) => {
      is(upring, peer)
      end()
      return {}
    }
  })
  const rifiExports = proxyquire('..', stubs)
  const peer = {}
  const store = new Map()
  rifiExports(peer, store)
})

test('does not create upring-pubsub instance if peer does have pubsub property', ({plan, fail}) => {
  plan(0)
  const stubs = Object.assign({}, noopStubs, {
    'upring-pubsub': ({upring}) => {
      fail()
    }
  })
  const rifiExports = proxyquire('..', stubs)
  const peer = {pubsub: {}}
  const store = new Map()
  rifiExports(peer, store)
})

test('passes through transform and globalTransform opts to module-deps', ({is, end}) => {
  const stubs = Object.assign({}, noopStubs, {
    'module-deps': ({transform, globalTransform}) => {
      is(transform, transformTest)
      is(globalTransform, globalTransformTest)
      end()
      return through()
    }
  })
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = { logger, request: () => {} }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const transformTest = []
  const globalTransformTest = []
  exports({name, transform: transformTest, globalTransform: globalTransformTest}, () => {})
})

test('spawns a child logger with MODULE, and component keys', ({is, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  var done = false
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      if (done === true) return this
      is(MODULE, 'rifi-exports')
      is(component, name)
      done = true
      end()
      return this
    }
  }
  const peer = { logger, request: () => {} }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  exports({name}, () => {})
})

test('waits until peer is ready', ({is, pass, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    isReady: false,
    once: (evt, cb) => {
      is(evt, 'up')
      peer.isReady = true
      cb()
    },
    request: () => {
      // if we reach this point, it's gotten past the peer.isReady check
      pass('responded to peer ready')
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  exports({name}, () => {})
})

test(`makes a peer request with pattern {key: name, ns: 'rifi', cmd: 'upload', name: name, deps} containing serialized dependency tree based the main option as entry point`, ({is, ok, end}) => {
  const stubs = Object.assign({}, noopStubs)
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      is(ptn.key, name)
      is(ptn.ns, 'rifi')
      is(ptn.cmd, 'upload')
      is(ptn.name, name)
      ok(Array.isArray(ptn.deps))
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic')
  exports({name, main}, () => {})
})

test('deps key of peer upload request contains serialized dependency tree of entry point (opts.main)', ({same, end}) => {
  const stubs = Object.assign({}, noopStubs)
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: ({deps}, cb) => {
      same(deps, expected)
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  const expected = [{file: main, id: main, source: fs.readFileSync(main).toString(), deps: {}}]
  exports({name, main}, () => {})
})

test('adds dependency tree to store after successful dep tree serialization', ({is, same, end}) => {
  const stubs = Object.assign({}, noopStubs)
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = { logger, request: () => {} }
  const store = {
    set: (n, o) => {
      is(n, name)
      same(o, expected)
      end()
    }
  }
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  const expected = [{file: main, id: main, source: fs.readFileSync(main).toString(), deps: {}}]
  exports({name, main}, () => {})
})

test('attempts to resolve modules prefixed with : (remote children) using remote load (rifi-load)', ({is, same, end}) => {
  const stubs = Object.assign({}, noopStubs, {
    'rifi-load': () => (cmp, cb) => {
      is(cmp, 'test')
      cb(null, [{file: name, id: name, source: '/*test*/', deps: {}}])
    }
  })
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: ({deps}, cb) => {
      same(deps, expected)
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = ':test'
  const main = join(__dirname, 'fixtures', 'remote.js')
  const expected = [
    {file: name, id: name, source: '/*test*/', deps: {}},
    {file: main, id: main, source: fs.readFileSync(main).toString(), deps: { ':test': name }}
  ]

  exports({name, main}, () => {})
})

test('emits upload:{name} topic on pubsub emitter after successful peer upload request', ({is, end}) => {
  const stubs = Object.assign({}, noopStubs)
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      cb(null, {ok: true})
    },
    pubsub: {
      emit: ({topic}) => {
        is(topic, `upload:${name}`)
        end()
      }
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  exports({name, main}, () => {})
})

test('listens to upload:{name} on pubsub emitter for each remote child', ({is, end}) => {
  const stubs = Object.assign({}, noopStubs, {
    'rifi-load': () => (cmp, cb) => {
      is(cmp, 'test')
      cb(null, [{file: name, id: name, source: '/*test*/', deps: {}}])
    }
  })
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      cb(null, {ok: true})
    },
    pubsub: {
      emit: () => {},
      on: (topic) => {
        is(topic, `upload:${name.substr(1)}`)
        end()
      }
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = ':test'
  const main = join(__dirname, 'fixtures', 'remote.js')
  exports({name: 'test', main}, () => {})
})

test('triggers reserialization when remote child emits upload:{name} topic', ({is, pass, plan}) => {
  plan(4)
  const stubs = Object.assign({}, noopStubs, {
    'rifi-load': () => (cmp, cb) => {
      is(cmp, 'test')
      cb(null, [{file: name, id: name, source: '/*test*/', deps: {}}])
    }
  })
  delete stubs['module-deps']
  var count = 0
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      if (count !== 1) return
      cb(null, {ok: true})
    },
    pubsub: {
      emit: () => {},
      on: (topic, cb) => {
        if (count !== 1) return
        is(topic, `upload:${name.substr(1)}`)
        /*eslint-disable */
        cb({}, () => {})
        /*eslint-enable */
      },
      removeListener: (topic) => {
        if (count !== 1) return
        is(topic, `upload:${name.substr(1)}`)
      }
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = ':test'
  const main = join(__dirname, 'fixtures', 'remote.js')
  exports({
    get name () {
      count++
      if (count === 2) pass('reserialization triggered (exports function called a second time)')
    },
    main
  }, () => {})
})

test('retries peer upload request on operational error', ({pass, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  var count = 0
  const peer = {
    logger,
    request: (ptn, cb) => {
      count++
      if (count === 1) cb(Error())
      if (count === 2) {
        pass('retry attempt occurred (peer.request called a second time)')
        end()
      }
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  exports({name, main}, () => {})
})

test('retries peer upload request on empty result', ({pass, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  var count = 0
  const peer = {
    logger,
    request: (ptn, cb) => {
      count++
      if (count === 1) cb()
      if (count === 2) {
        pass('retry attempt occurred (peer.request called a second time)')
        end()
      }
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  exports({name, main}, () => {})
})

test('retries peer upload request if result.ok is not true', ({pass, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  var count = 0
  const peer = {
    logger,
    request: (ptn, cb) => {
      count++
      if (count === 1) cb(null, {result: {ok: false}})
      if (count === 2) {
        pass('retry attempt occurred (peer.request called a second time)')
        end()
      }
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  exports({name, main}, () => {})
})

test('when retrying peer upload request due to operational error, retries up to MAX_RETRY every RETRY_WAIT ms then emits error on peer', ({is, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const { MAX_RETRY, RETRY_WAIT } = rifiExports.constants
  const logger = pino({level: 'silent'})

  var count = 0
  const peer = {
    logger,
    request: (ptn, cb) => {
      count++
      cb(Error('test'))
    },
    emit: (evt, err) => {
      const duration = Date.now() - start
      is(count, MAX_RETRY)
      // first attempt is instant, so total time is (MAX_RETRY - 1) * RETRY_WAIT
      is(RETRY_WAIT * Math.round(duration / RETRY_WAIT), (MAX_RETRY - 1) * RETRY_WAIT)
      is(evt, 'error')
      is(err.message, 'test')
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  const start = Date.now()
  exports({name, main}, () => {})
})

test('when retrying peer upload request due to non-operational error, retries up to MAX_RETRY every RETRY_WAIT ms then emits GENERIC error on peer', ({is, end}) => {
  const rifiExports = proxyquire('..', noopStubs)
  const { MAX_RETRY, RETRY_WAIT } = rifiExports.constants
  const logger = pino({level: 'silent'})

  var count = 0
  const peer = {
    logger,
    request: (ptn, cb) => {
      count++
      cb()
    },
    emit: (evt, err) => {
      const duration = Date.now() - start
      is(count, MAX_RETRY)
      // first attempt is instant, so total time is (MAX_RETRY - 1) * RETRY_WAIT
      is(RETRY_WAIT * Math.round(duration / RETRY_WAIT), (MAX_RETRY - 1) * RETRY_WAIT)
      is(evt, 'error')
      is(err.message, 'unable to upload')
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'basic.js')
  const start = Date.now()
  exports({name, main}, () => {})
})

test('retries remote child resolution on load failure (when data in system hasn\'t become consistent yet)', ({is, pass, end}) => {
  var count = 0
  const stubs = Object.assign({}, noopStubs, {
    'rifi-load': () => (cmp, cb) => {
      count++
      if (count === 1) {
        is(cmp, 'test')
        cb(Error())
      }
      if (count === 2) {
        is(cmp, 'test')
        pass('retry attempt occurred (load called a second time)')
        end()
      }
    }
  })
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const logger = pino({level: 'silent'})
  const peer = { logger, request: () => {} }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'remote.js')
  exports({name, main}, () => {})
})

test('retries remote child resolution up to MAX_RETRY every RETRY_WAIT ms then emits error on peer', ({is, end}) => {
  var count = 0
  const stubs = Object.assign({}, noopStubs, {
    'rifi-load': () => (cmp, cb) => {
      count++
      cb(Error('test operational error'))
    }
  })
  delete stubs['module-deps']
  const rifiExports = proxyquire('..', stubs)
  const { MAX_RETRY, RETRY_WAIT } = rifiExports.constants
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: () => {},
    emit: (evt, err) => {
      const duration = Date.now() - start
      is(count, MAX_RETRY)
      is(RETRY_WAIT * Math.round(duration / RETRY_WAIT), (MAX_RETRY - 1) * RETRY_WAIT)
      is(evt, 'error')
      is(err.message, 'test operational error')
      end()
    }
  }
  const store = new Map()
  const exports = rifiExports(peer, store)
  const name = 'test'
  const main = join(__dirname, 'fixtures', 'remote.js')
  const start = Date.now()
  exports({name, main}, () => {})
})
