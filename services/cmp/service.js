'use strict'

const { join } = require('path')
const rifi = require('rifi')
const peers = [require('os').networkInterfaces().en0[1].address + ':9999']

const babelify = require('babelify').configure({
  presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve)
})

const service = rifi({
  join: peers,
  logLevel: 'debug'
})

service.component({
  name: 'cmp',
  main: join(__dirname, 'component'),
  transform: [babelify]
})

service.module({
  name: 'cmp/reducer',
  main: join(__dirname, 'component', 'reducer'),
  transform: [babelify]
})
