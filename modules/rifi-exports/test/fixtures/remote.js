'use strict'

const test = require(':test')

module.exports = testComponent

function testComponent ({render}) {
  return render`${test()}`
}
