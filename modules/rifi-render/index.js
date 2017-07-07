'use strict'

const pack = require('nodepack')
const through = require('through2')
const pump = require('pump')

const create = {
  load: require('rifi-load')
}

const MODULE = 'rifi-render'

module.exports = rifiRender 

function rifiRender (peer, store) {

  return function render (name, cb) {
    
    const logger = peer.logger.child({MODULE, component: name})

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => render(name, cb))
      return
    }

    const load = create.load(peer, store)

    load(name, (err, deps) => {
      if (err) return void cb(err)
      const packer = pack({raw: true})
      const js = []
      pump(packer, through((buffer, _, next) => {
        js.push(buffer)
        next()
      }), (err) => {
        if (err) {
          return void cb(err)
        }

        const bundle = js.map((b) => b.toString()).join('')
        const req = Function(`return ${bundle}`)()
        const view = req(deps[deps.length-1].id)
        const html = view()

        cb(null, html)
      })

      deps.forEach((dep) => packer.write(dep))

      packer.end()
    })
  }


}