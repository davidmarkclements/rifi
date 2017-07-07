'use strict'

const React = require('react')
const dt = require('date-time')

const anAction = (payload) => ({type: 'foo', payload})

module.exports = ChildComponent

function ChildComponent(props) {
  const { msg } = props
  return (
    <div>
      <h2> This is <em>ChildComponent</em> </h2>
      <p> <span> { dt() }: </span> {msg} </p>
    </div>
  )
}
