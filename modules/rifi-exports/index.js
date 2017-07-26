'use strict'

const pubsub = require('upring-pubsub')
const mdeps = require('module-deps')
const bresolve = require('browser-resolve')
const pump = require('pump')
const through = require('through2')
const create = {
  load: require('rifi-load')
}
const MODULE = 'rifi-exports'
const MAX_RETRY = 5
const RETRY_WAIT = 500

module.exports = rifiExports
rifiExports.constants = { MODULE, MAX_RETRY, RETRY_WAIT }

function rifiExports (peer, store) {
  const ps = peer.pubsub || pubsub({upring: peer})

  const load = create.load(peer, store)

  return function exports (opts) {
    const {name, main, transform = [], globalTransform = []} = opts

    const logger = peer.logger.child({MODULE, component: name})

    if (peer.isReady === false) {
      logger.debug('waiting for peer to be ready')
      peer.once('up', () => exports(opts))
      return
    }

    logger.debug(`registering new dependency: ${name}`)

    logger.debug(`serializing dependencies: ${name}`)

    const attempts = {upload: MAX_RETRY, serialize: MAX_RETRY}

    const md = mdeps({ resolve, transform, globalTransform, cache: {} })
    const deps = []
    const children = []

    function bail (err) {
      peer.emit('error', err)
    }

    md.once('error', (err) => {
      logger.fatal('FATAL: UNABLE TO SERIALIZE DEPENDENCY', err)
      bail(err)
    })

    pump(md, through.obj((o, _, cb) => {
      // entry is not reliable and gets in the way
      if (o.entry) delete o.entry // consider: to-fast-properties
      deps.push(o)
      cb()
    }), upload)

    function upload (err) {
      attempts.upload--
      if (err) {
        logger.error(err, `problem serializing dependencies of ${name}`)
        return
      }

      logger.debug(`making dependencies available from current process: ${name}`)

      store.set(name, deps)

      const ptn = {
        key: name,
        ns: 'rifi',
        cmd: 'upload',
        name: name,
        deps: deps
      }

      logger.debug(`uploading dependencies: ${name}`)

      peer.request(ptn, (err, result) => {
        if (err) {
          logger.error(err, `problem uploading dependencies: ${name}`)
          return void retryUpload(err)
        }
        if (!result) {
          logger.error(`empty response to dependencies upload: ${name}`)
          return void retryUpload()
        }
        if (result.ok !== true) {
          logger.error(result, `problem uploading dependencies: ${name}`)
          return void retryUpload()
        }
        logger.info(result, `dependencies uploaded: ${name}`)

        // now listen to uploads from children
        // reserialize when a child updates - in future, just patch the dep tree
        children.forEach((child) => {
          const topic = `upload:${child}`
          ps.on(topic, function onMessage (msg, cb) {
            exports(opts)
            cb()
            ps.removeListener(topic, onMessage)
          })
        })

        ps.emit({topic: `upload:${name}`})
      })
    }

    function retryUpload (err) {
      logger.debug('retrying  upload')
      if (attempts.upload === 0) {
        logger.fatal('FATAL: UNABLE TO UPLOAD DEPENDENCY', err || '')
        bail(err || Error('unable to upload'))
        return
      }
      setTimeout(upload, RETRY_WAIT)
    }

    md.end({file: main})

    function resolve (id, parent, cb) {
      if (id[0] !== ':') return void bresolve(id, parent, cb)
      const dependency = id.substr(1)
      load(dependency, (err, deps) => {
        if (err) {
          logger.error(err, `unable to get dependencies for ${id} retrying`)
          attempts.serialize--
          if (attempts.serialize < 1) {
            attempts.serialize = MAX_RETRY
            return void cb(err)
          }
          return void setTimeout(resolve, RETRY_WAIT, id, parent, cb)
        }
        children.push(dependency)
        deps.forEach((dep) => { md.cache[dep.file] = dep })
        attempts.serialize = MAX_RETRY
        cb(null, deps[deps.length - 1].file)
      })
    }
  }
}
