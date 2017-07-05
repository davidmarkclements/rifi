'use strict'

const { join } = require('path')
const { test } = require('tap')
const component = require('../')


test('returns a function', async ({is}) => {
  const peer = mockPeer()
  is(typeof component(peer), 'function') 
})

test('registers cmd:load, name:{name} on peer', ({is, end}) => {
  const peer = mockPeer((args) => {
    is(args.name, 'test')
    end()
  })
  const cmp = component(peer)
  cmp({name: 'test'})
})

test('responds to peer request with {name, streams: {dependencies}}', ({is, ok, end}) => {
  const peer = mockPeer((args, cb) => {
    cb({}, reply)
    function reply (err, {name, streams}) {
      is(name, 'test')
      ok(streams.dependencies)
      streams.dependencies.once('data', (chunk) => {
        const { file, id, source, deps } = JSON.parse(chunk)
        ok(file)
        ok(id)
        ok(source)
        ok(deps)
        streams.dependencies.once('end', end)
      })
    }
  })
  const cmp = component(peer)
  cmp({name: 'test', main: join(__dirname, 'fixtures', 'test-cmp')})
})



function mockPeer (add = (() => {}), logger) {
  logger = logger || new Proxy({}, {
    get: () => (() => {})
  })
  return { add, logger }
}