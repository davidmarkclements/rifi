'use strict'

const { test } = require('tap')
const proxyquire = require('proxyquire')
const pino = require('pino')
const noopStubs = {}

test('exports a function', ({is, end}) => {
  const rifiBundle = proxyquire('..', {})
  is(typeof rifiBundle, 'function')
  end()
})

test('returns function', ({is, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  const peer = {}
  const store = new Map()
  const load = rifiLoad(peer, store)
  is(typeof load, 'function')
  end()
})

test('spawns a child logger with MODULE, and component keys', ({is, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  var done = false
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      if (done === true) return this
      is(MODULE, 'rifi-load')
      is(component, name)
      done = true
      end()
      return this
    }
  }
  const peer = { logger, request: () => {} }
  const store = new Map()
  const load = rifiLoad(peer, store)
  const name = 'test'
  load(name, () => {})
})

test('waits until peer is ready', ({is, pass, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
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
  const load = rifiLoad(peer, store)
  const name = 'test'
  load(name, () => {})
})

test('if local store contains a dependency, loads dependency from store', ({is, pass, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = { logger }
  const store = new Map()
  const load = rifiLoad(peer, store)
  const test = {}
  const name = 'test'
  store.set(name, test)
  load(name, (err, dep) => {
    if (err) throw err
    is(dep, test)
    end()
  })
})

test(`if local store does not contain dependency, makes a peer request with pattern { key: name, ns: 'rifi', cmd: 'load', name: name }`, ({is, pass, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      is(ptn.key, name)
      is(ptn.ns, 'rifi')
      is(ptn.cmd, 'load')
      is(ptn.name, name)
      end()
    }
  }

  const store = new Map()
  const load = rifiLoad(peer, store)
  const name = 'test'
  load(name, () => {})
})

test(`propagates peer request errors to callback`, ({is, pass, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      cb(test)
    }
  }

  const store = new Map()
  const load = rifiLoad(peer, store)
  const test = Error('test)')
  const name = 'test'
  load(name, (err) => {
    is(err, test)
    end()
  })
})

test(`passes empty/falsy results directly through callback`, ({is, pass, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      cb()
    }
  }

  const store = new Map()
  const load = rifiLoad(peer, store)
  const name = 'test'
  load(name, (err, deps) => {
    is(err, null)
    is(deps, undefined)
    end()
  })
})

test(`if present, passes the deps property of result through callback`, ({is, pass, end}) => {
  const rifiLoad = proxyquire('..', noopStubs)
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    request: (ptn, cb) => {
      cb(null, {deps: test})
    }
  }

  const store = new Map()
  const load = rifiLoad(peer, store)
  const name = 'test'
  const test = []
  load(name, (err, deps) => {
    if (err) throw err
    is(deps, test)
    end()
  })
})
