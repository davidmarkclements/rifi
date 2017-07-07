'use strict'

const React = require('react')
const RemoteChildComponent = require(':child-cmp')

module.exports = Component

function Component(props) {
  const { msg } = props
  return (
    <div>
      <h1> This is <em>Component</em> </h1>
      <RemoteChildComponent msg={msg}/>
    </div>
  )
}