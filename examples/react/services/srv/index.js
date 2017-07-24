'use strict'

const http = require('http')
const rifi = require('rifi')
const pump = require('pump')
const ifaces = require('os').networkInterfaces()
const host = ifaces.en0 ? ifaces.en0[1].address : 'localhost'
const peers = [host + ':9999']

const serve = rifi.serve({
  join: peers,
  logLevel: 'debug'
})

const { logger } = serve

const server = http.createServer((req, res) => {
  const [ route ] = req.url.split('?')
  if (route === '/app.js') return void js(req, res)
  if (route === '/') return void html(req, res)
  if (route === '/state') return void state(req, res)

  res.statusCode = 404
  res.end('Not Found')
})

function js (req, res) {
  res.setHeader('Content-Type', 'application/x-javascript; charset=utf-8')
  serve.bundle('app', (err, view) => {
    if (err) {
      logger.error(err, 'bundling error')
      res.end(`// bundling error: ${err.message}`)
      return
    }
    pump(view, res, (err) => {
      if (err) {
        if (res.ended === false) {
          res.end(`// write error: ${err.message}`)
        }
        logger.error(err, 'write error')
      }
    })
  })
}

function html (req, res) {
  res.setHeader('Content-Type', 'text/html')
  serve.render('index', (err, view) => {
    if (err) {
      logger.error(err, 'rendering error')
      res.end(`<h1> Rendering Error</h1><h2>${err.message}</h2>`)
      return
    }

    res.end(view)
  })
}

function state (req, res) {
  res.setHeader('Content-Type', 'application/json')
  serve.peer.ready(() => {
    const peers = serve.peer.peers()
    var count = peers.length
    res.write('{\n')
    res.write(`  "${serve.peer.whoami()}": ${JSON.stringify({
      ok: true, components: Array.from(serve.store.keys()), type: 'client'
    }, 0, 2)}`)
    if (count === 0) res.end('\n}')
    else res.write(',\n')
    peers.forEach((peer) => {
      serve.peer.peerConn(peer).request({ns: 'rifi', cmd: 'ls'}, (err, cmps) => {
        res.write(`  "${peer.id}": `)
        if (err) {
          res.write(`"Error: ${err.message}"`)
          return
        }
        cmps.type = 'full'
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
