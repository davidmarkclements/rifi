'use strict'

const dt = require('date-time')

const anAction = (payload) => ({type: 'foo', payload})

module.exports = createComponent

function createComponent (ctx) {

  const { render, dispatch } = ctx
  const onclick = '' //() => dispatch(anAction('wow'))

  return (props) => {
    
    const { msg } = props
    
    return render `
      <div>
        <p> eek barba durkle </p>
        <p onclick=${onclick}> <span> ${dt()}: </span> ${msg} </p>
      </div>
    `

  }

}