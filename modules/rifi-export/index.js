'use strict'

const pubsub = require('upring-pubsub')
const mdeps = require('module-deps')
const bresolve = require('browser-resolve')
const pump = require('pump')
const through = require('through2')
const create = {
  load: require('rifi-load')
}
const MODULE = 'rifi-export'
const MAX_RETRY = 5
const RETRY_WAIT = 500

module.exports = rifiExport

function rifiExport (peer, store) {

  const ps = peer.pubsub || pubsub({upring: peer})

  const load = create.load(peer, store)

  return function _export (opts) {
    
    const {name, main, transform = [], globalTransform = []} = opts

    const logger = peer.logger.child({MODULE, component: name})

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => _export(opts))
      return
    }

    logger.debug(`registering new component: ${name}`)

    logger.debug(`serializing dependencies: ${name}`)

    const attempts = {upload: MAX_RETRY, serialize: MAX_RETRY}

    function retryUpload () {
      logger.debug('retrying component upload')
      attempts.upload--
      if (attempts.upload === 0) {
        logger.fatal('FATAL: UNABLE TO UPLOAD COMPONENT')
        process.exit(1)
      }
      setTimeout(component, RETRY_WAIT, opts)
    }
   
    const md = mdeps({ resolve, transform, globalTransform })
    const deps = []
    const children = []

    pump(md, through.obj((o, _, cb) => {
      deps.push(o)
      cb()
    }), (err) => {
      if (err) {
        logger.error(err, `problem serializing dependencies of component: ${name}`)
        return
      }
      
      logger.debug(`making component dependencies available from current process: ${name}`)

      store.set(name, deps)

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
          return void retryUpload()
        }
        if (!result) {
          logger.error(`empty response to component dependencies upload: ${name}`)
          return void retryUpload()
        }
        if (result.ok !== true) {
          logger.error(result, `problem uploading component dependencies: ${name}`)
          return void retryUpload()
        }
        logger.info(result, `component dependencies uploaded: ${name}`)

        // now listen to uploads from children
        // reserialize when a child updates - in future, just patch the dep tree 
        children.forEach((child) => {
          const upload = `upload:${child}`
          ps.on(upload, function onMessage(msg, cb) {
            component(opts)
            cb()
            ps.removeListener(upload, onMessage)
          })
        })

        ps.emit({topic: `upload:${name}`})

      })      

    })

    md.end({file: main})

    function resolve (id, parent, cb) {
      if (id[0] !== ':') return void bresolve(id, parent, cb)
      if (attempts.serialize < 0) {
        return void cb(Error('unable to get depdencies'))
      }
      const component = id.substr(1)
      children.push(component)
      load(component, (err, deps) => {
        if (attempts.serialize < 0) {
          attempts.serialize = MAX_RETRY
          return void cb(Error('unable to get depdencies'))
        } 

        if (err) {
          logger.error(err, `unable to get dependencies for ${id} ${attempts.serialize === 0 ? '' : 'retrying'}`)
          if (attempts.serialize === 0) {
            // TODO create placeholder for cmp with error message in placeholder
            attempts.serialize = MAX_RETRY
            return void cb(err)
          }
          return void setTimeout(() => {
            attempts.serialize--
            resolve(id, parent, cb)
          }, RETRY_WAIT)
        }

        md.push(...deps)
        attempts.serialize = MAX_RETRY
        cb(null, deps[deps.length - 1].id)
      })
      
    }

  } 

}