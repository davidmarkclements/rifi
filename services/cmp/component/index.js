'use strict'

const childCmp = require(':child-cmp')

module.exports = createComponent

function createComponent (ctx) {

  const { render, dispatch } = ctx

  const child = childCmp(ctx)

  return (props) => {
    
    const { msg } = props
    
    return render `
      <div>
        <p> YO! Sup. </p>
        ${child(props)}
      </div>
    `

  }

}