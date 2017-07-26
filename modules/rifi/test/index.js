'use strict'

const { test } = require('tap')
const pino = require('pino')
const through = require('through2')
const proxyquire = require('proxyquire').noPreserveCache()
const noop = () => {}
const noopStubs = {
  upring: noop,
  'rifi-sync': noop,
  'rifi-exports': noop,
  'rifi-load': noop,
  'rifi-bundle': noop,
  'rifi-render': noop
}

test('exports a function', ({is, end}) => {
  const rifiBundle = proxyquire('..', {})
  is(typeof rifiBundle, 'function')
  end()
})

test('returns an object with shape { logger, peer, store, exports, load, bundle, render, close }', ({ok, end}) => {
  const rifi = proxyquire('..', {})
  const { logger, peer, store, exports, load, bundle, render, close } = rifi({logLevel: 'silent'})
  ok(logger)
  ok(peer)
  ok(store)
  ok(exports)
  ok(load)
  ok(bundle)
  ok(render)
  ok(close)
  close()
  end()
})

test('built-in logger defaults to info', ({is, end}) => {
  const rifi = proxyquire('..', {
    upring: proxyquire('upring', {
      pino: () => pino(through())
    })
  })
  const { logger, close } = rifi()
  is(logger.level, 'info')
  close()
  end()
})

test('accepts a custom logger, spawns a child bound with MODULE key', ({is, end}) => {
  const rifi = proxyquire('..', {})
  const stream = through((chunk, _, cb) => {
    const { MODULE } = JSON.parse(chunk)
    is(MODULE, 'rifi')
    close()
    end()
  })
  // set level to fatal so we can ignore other log messages
  const { close, logger } = rifi({logger: pino(stream), logLevel: 'fatal'})
  logger.fatal('test')
})

test('logLevel option overrides custom logger defaults ', ({is, end}) => {
  const rifi = proxyquire('..', {})
  const stream = through((chunk, _, cb) => {
    const { level } = JSON.parse(chunk)
    is(level, 60)
    close()
    end()
  })
  const { close, logger } = rifi({logger: pino(stream), logLevel: 'fatal'})
  logger.fatal('test')
})

test('creates peer with upring when opts.peer is not set', ({pass, is, end}) => {
  var test
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: () => {
      pass()
      test = {logger: pino({level: 'silent'})}
      return test
    }
  }))
  const { peer } = rifi()
  is(peer, test)
  end()
})

test('accepts custom peer object passed through options', ({is, fail, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: () => {
      fail()
    }
  }))
  const test = {logger: pino({level: 'silent'})}
  const { peer } = rifi({peer: test})
  is(peer, test)
  end()
})

test('passes logger option to upring module as logger option (when no peer supplied)', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({logger}) => {
      is(logger, test)
      end()
      return {logger}
    }
  }))
  const test = pino({level: 'silent'})
  rifi({logger: test})
})

test('passes client option to upring module as client option (when no peer supplied)', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({client}) => {
      is(client, test)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = true
  rifi({client: test})
})

test('passes hashring options to upring module as hashring option (when no peer supplied)', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({hashring}) => {
      is(hashring, test)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = {}
  rifi({hashring: test})
})

test('passes join option to upring module as base option (when no peer supplied)', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({base}) => {
      is(base, test)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = ['127.0.0.1:1337']
  rifi({join: test})
})

test('passes port option to upring module as port option (when no peer supplied)', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({port}) => {
      is(port, test)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = 1337
  rifi({port: test})
})

test('port option cascades to hashring.port option if hashring opts not passed', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({port, hashring}) => {
      is(port, test)
      is(hashring.port, test)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = 1337
  rifi({port: test})
})

test('port option cascades to hashring.port option if port not set in hashring passed opts', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({port, hashring}) => {
      is(port, test)
      is(hashring, hashringTest)
      is(hashring.port, test)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = 1337
  const hashringTest = {}
  rifi({port: test, hashring: hashringTest})
})

test('port option does not cascade to hashring.port option if port is set in hashring passed opts', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({port, hashring}) => {
      is(port, test)
      is(hashring, hashringTest)
      is(hashring.port, hashringTestPort)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  const test = 1337
  const hashringTestPort = 1338
  const hashringTest = {port: hashringTestPort}
  rifi({port: test, hashring: hashringTest})
})

test('rifi.serve creates a client peer', ({is, end}) => {
  const rifi = proxyquire('..', Object.assign({}, noopStubs, {
    upring: ({client}) => {
      is(client, true)
      end()
      return {logger: pino({level: 'silent'})}
    }
  }))
  rifi.serve()
})
