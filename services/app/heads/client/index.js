'use strict'

const createCmp = require(':cmp')

const dispatch = (...args) => console.log(args)
var str = ''

const render = (...args) => {
  const s = String.raw(...args) 
  
  str = s

  return s
}

createCmp({dispatch, render})({ msg: 'hello there!' })

document.body.innerHTML = str