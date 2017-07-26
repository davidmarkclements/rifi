'use strict'

const { test } = require('tap')
const { Stream } = require('stream')
const pino = require('pino')
const through = require('through2')
const proxyquire = require('proxyquire').noPreserveCache()
const noopStubs = {
  'rifi-load': () => () => {}
}

test('exports a function', ({is, end}) => {
  const rifiBundle = proxyquire('..', {})
  is(typeof rifiBundle, 'function')
  end()
})

test('returns function', ({is, end}) => {
  const rifiBundle = proxyquire('..', {})
  const peer = {}
  const store = new Map()
  const bundle = rifiBundle(peer, store)
  is(typeof bundle, 'function')
  end()
})

test('spawns a child logger with MODULE, and component keys', ({is, end}) => {
  const rifiBundle = proxyquire('..', noopStubs)
  var done = false
  const logger = {
    __proto__: pino({level: 'silent'}),
    child: function ({MODULE, component}) {
      if (done === true) return this
      is(MODULE, 'rifi-bundle')
      is(component, name)
      done = true
      end()
      return this
    }
  }
  const peer = { logger }
  const store = new Map()
  const bundle = rifiBundle(peer, store)
  const name = 'test'
  bundle(name, () => {})
})

test('waits until peer is ready', ({is, pass, end}) => {
  const rifiBundle = proxyquire('..', {
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
  const bundle = rifiBundle(peer, store)
  const name = 'test'
  bundle(name, () => {})
})

test('attempts to load component', ({is, end}) => {
  const rifiBundle = proxyquire('..', {
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
  const bundle = rifiBundle(peer, store)
  const test = 'test'
  bundle(test, () => {})
})

test('propagates any errors from load attempt', ({is, end}) => {
  const rifiBundle = proxyquire('..', {
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
  const bundle = rifiBundle(peer, store)
  const test = Error('test')
  bundle('test', (err) => {
    is(err, test)
  })
})

test('calls back with a stream which converts dependency tree from load response into a JS bundle', ({is, ok, end}) => {
  const rifiBundle = proxyquire('..', {
    'rifi-load': (p, s) => {
      is(p, peer)
      is(s, store)
      return (name, cb) => {
        cb(null, test)
      }
    }
  })
  const logger = pino({level: 'silent'})
  const peer = { logger }
  const store = new Map()
  const bundle = rifiBundle(peer, store)
  const test = [{'file': 'test.js', 'id': 'test.js', 'source': "console.log('hi')\n", 'deps': {}, 'entry': true}]
  bundle('test', (err, packer) => {
    if (err) throw err
    ok(packer instanceof Stream)
    var js = ''
    packer.pipe(through((chunk, _, cb) => {
      js += chunk
      cb()
    }))

    packer.once('end', () => {
      is(js, `(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.test || (g.test = {})).js = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"test.js":[function(require,module,exports){
        console.log('hi')

        },{}]},{},["test.js"])("test.js")
      });`.split('\n').map(line => line.trimLeft()).join('\n'))
      end()
    })
  })
})
