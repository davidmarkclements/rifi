'use strict'

const { test } = require('tap')
const pino = require('pino')
const proxyquire = require('proxyquire').noPreserveCache()
const noopStubs = {
  'rifi-load': () => () => {}
}

test('exports a function', ({is, end}) => {
  const rifiRender = proxyquire('..', {})
  is(typeof rifiRender, 'function')
  end()
})

test('returns function', ({is, end}) => {
  const rifiRender = proxyquire('..', {})
  const peer = {}
  const store = new Map()
  const bundle = rifiRender(peer, store)
  is(typeof bundle, 'function')
  end()
})

test('spawns a child logger with MODULE, and component keys', ({is, end}) => {
  const rifiRender = proxyquire('..', noopStubs)
  var done = false
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      if (done === true) return this
      is(MODULE, 'rifi-render')
      is(component, name)
      done = true
      end()
      return this
    }
  }
  const peer = { logger }
  const store = new Map()
  const bundle = rifiRender(peer, store)
  const name = 'test'
  bundle(name, () => {})
})

test('waits until peer is ready', ({is, pass, end}) => {
  const rifiRender = proxyquire('..', {
    'rifi-load': (p, s) => {
      is(p, peer)
      is(s, store)
      // if we reach this point, it's gotten past the peer.isReady check
      pass()
      end()
      return () => {}
    }
  })
  const logger = pino({level: 'silent'})
  const peer = {
    logger,
    isReady: false,
    once: (evt, cb) => {
      is(evt, 'up')
      peer.isReady = true
      cb()
    }
  }
  const store = new Map()
  const bundle = rifiRender(peer, store)
  const name = 'test'
  bundle(name, () => {})
})

test('attempts to load component', ({is, end}) => {
  const rifiRender = proxyquire('..', {
    'rifi-load': (p, s) => {
      is(p, peer)
      is(s, store)
      return (name, cb) => {
        is(name, test)
        end()
      }
    }
  })
  const logger = pino({level: 'silent'})
  const peer = { logger }
  const store = new Map()
  const bundle = rifiRender(peer, store)
  const test = 'test'
  bundle(test, () => {})
})

test('propagates any errors from load attempt', ({is, end}) => {
  const rifiRender = proxyquire('..', {
    'rifi-load': (p, s) => {
      is(p, peer)
      is(s, store)
      return (name, cb) => {
        cb(test)
        end()
      }
    }
  })
  const logger = pino({level: 'silent'})
  const peer = { logger }
  const store = new Map()
  const bundle = rifiRender(peer, store)
  const test = Error('test')
  bundle('test', (err) => {
    is(err, test)
  })
})

test('calls back with a return value (expected to be a string) of the function exported from the supplied entrypoint', ({is, ok, end}) => {
  const rifiRender = proxyquire('..', {
    'rifi-load': (p, s) => {
      is(p, peer)
      is(s, store)
      return (name, cb) => {
        is(name, 'test')
        cb(null, test)
      }
    }
  })
  const logger = pino({level: 'silent'})
  const peer = { logger }
  const store = new Map()
  const render = rifiRender(peer, store)
  const test = [{'file': 'test.js', 'id': 'test', 'source': 'module.exports = () => `test`', 'deps': {}}]
  render('test', (err, str) => {
    if (err) throw err
    is(str, 'test')
    end()
  })
})
