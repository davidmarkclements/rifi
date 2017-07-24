'use strict'

const { join } = require('path')
const rifi = require('rifi')
const ifaces = require('os').networkInterfaces()
const host = ifaces.en0 ? ifaces.en0[1].address : 'localhost'
const peers = [host + ':9999']

const babelify = require('babelify').configure({
  presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve)
})

const service = rifi({
  join: peers,
  logLevel: 'debug'
})

service.export({  
  name: 'index',
  main: join(__dirname, 'server'),
  transform: [babelify]
})

service.export({
  name: 'app',
  main: join(__dirname, 'client'),
  transform: [babelify]
})

service.export({
  name: 'constants',
  main: join(__dirname, 'constants'),
  transform: [babelify]
})

service.export({
  name: 'react', 
  main: require.resolve('react')
})