'use strict'

const http = require('http')
const { join } = require('path')
const rifi = require('rifi')
const pump = require('pump')
const peers = ['192.168.1.111:9999']

const app = rifi.app({
  join: peers,
  logLevel: 'debug'
})

app.view({
  name: 'index',
  main: join(__dirname, 'heads', 'server', 'index')
})

app.head({
  name: 'app',
  main: join(__dirname, 'heads', 'client', 'index')
})

const server = http.createServer((req, res) => {
  if (req.url === '/app.js') return void js(req, res)
  if (req.url === '/') return void html(req, res)
  if (req.url === '/state') return void state(req, res)

  res.statusCode = 404
  res.end('Not Found')
})

function js (req, res) {
  res.setHeader('Content-Type', 'application/x-javascript; charset=utf-8')
  app.bundle('app', (err, view) => {
    if (err) {
      app.logger.error(err, 'bundling error')
      res.end(`// bundling error: ${err.message}`)
      return
    }
    pump(view, res, (err) => {
      if (err) {
        if (res.ended === false) { 
          res.end(`// write error: ${err.message}`)
        }
        app.logger.error(err, 'write error')
        return
      }
    })
  })
}

function html (req, res) {
  res.setHeader('Content-Type', 'text/html')
  app.render('index', (err, view) => {
    if (err) {
      app.logger.error(err, 'rendering error')
      res.end(`<h1> Rendering Error</h1><h2>${err.message}</h2>`)
      return
    }

    res.end(view)
 
  })
}


function state (req, res) {
  res.setHeader('Content-Type', 'application/json')
  app.peer.ready(() => {
    const peers = app.peer.peers()
    var count = peers.length
    res.write('{\n')
    peers.forEach((peer) => {
      app.peer.peerConn(peer).request({ns: 'rifi', cmd: 'list-stored-components'}, (err, cmps) => {
        res.write(`  "${peer.id}":`)
        if (err) {
          res.write(`"Error: ${err.message}"`)
          return
        }
        res.write(JSON.stringify(cmps, 0, 2))
        count--
        if (count === 0) {
          res.end('\n}')
        } else {
          res.write(',\n')
        }
      })
    })
  })
}


server.listen(3000)
