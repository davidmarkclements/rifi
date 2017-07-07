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

service.view({  
  name: 'index',
  main: join(__dirname, 'server'),
  transform: [babelify]
})

service.app({
  name: 'app',
  main: join(__dirname, 'client'),
  transform: [babelify]
})

