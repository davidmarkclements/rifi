'use strict'

const mdeps = require('module-deps')
const bresolve = require('browser-resolve')
const pump = require('pump')
const ndjson = require('ndjson')
const through = require('through2')
const create = {
  load: require('rifi-load')
}
const MODULE = 'rifi-component'
const MAX_RETRY = 5
const RETRY_WAIT = 500

module.exports = rifiComponent

function rifiComponent (peer, cache) {

  const load = create.load(peer, cache)

  return function component (opts) {
    
    const {name, main, transforms} = opts

    const logger = peer.logger.child({MODULE, component: name})

    var attempts = {upload: MAX_RETRY, serialize: MAX_RETRY}
    function retryUpload () {
      logger.debug('retrying component upload')
      attempts.upload--
      if (attempts.upload === 0) {
        logger.fatal('FATAL: UNABLE TO UPLOAD COMPONENT')
        process.exit(1)
      }
      setTimeout(component, RETRY_WAIT, opts)
    }

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => component(opts))
      return
    }

    logger.debug(`registering new component: ${name}`)

    logger.debug(`serializing dependencies: ${name}`)
   
    const md = mdeps({ resolve })
    const deps = []

    pump(md, through.obj((o, _, cb) => {
      deps.push(o)
      cb()
    }), (err) => {
      if (err) {
        logger.error(err, `problem serializing dependencies of component: ${name}`)
        return
      }
      
      logger.debug(`making component dependencies available from current process: ${name}`)

      cache.set(name, deps)

      const ptn = {
        key: name,
        ns: 'rifi',
        cmd: 'upload',
        name: name,
        deps: deps
      }

      logger.debug(`uploading component dependencies: ${name}`)

      peer.request(ptn, (err, result) => {
        if (err) {
          logger.error(err, `problem uploading component dependencies: ${name}`)
          return void retry()
        }
        if (!result) {
          logger.error(`empty response to component dependencies upload: ${name}`)
          return void retry()
        }
        if (result.ok !== true) {
          logger.error(result, `problem uploading component dependencies: ${name}`)
          return void retry()
        }
        logger.info(result, `component dependencies uploaded: ${name}`)
      })      

    })

    md.end({file: main})

    function resolve (id, parent, cb) {
      if (id[0] === ':') {
        // id = id.substr(1)
        load(id.substr(1), (err, deps) => {
          if (err) {
            logger.error(err, `unable to get dependencies for ${id} ${attempts.serialize === 0 ? '' : 'retrying'}`)
            if (attempts.serialize === 0) {
              // TODO create placeholder for cmp with error message in placeholder
              return void cb(err)
            }
            return void setTimeout(() => {
              attempts.serialize--
              resolve(id, parent, cb)
            }, RETRY_WAIT)
          }
          md.push(...deps)

          cb(null, deps[deps.length - 1].id)
        })

        return
      }
      
      bresolve(id, parent, cb)
    }

  } 

}