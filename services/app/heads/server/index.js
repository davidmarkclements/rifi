'use strict'

const createCmp = require(':cmp')

const dispatch = (...args) => console.log(args)
const render = String.raw

const cmp = createCmp({ render, dispatch })

module.exports = html

function html (state = {msg: 'hello'}) {
  return render `
    <html>
    <head><title>app</title></head>
    <body>
      ${cmp(state)}
      <script src='app.js'></script>
    </body>
    </html>
  `
}