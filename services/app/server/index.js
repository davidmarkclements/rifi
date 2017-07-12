'use strict'

// const createCmp = require(':cmp')

const dispatch = (...args) => console.log(args)
const render = String.raw

// const cmp = createCmp({ render, dispatch })

const cachebust = 'ah'

module.exports = html

function html (state = {msg: 'hello'}) {
  return render `
    <html>
    <head><title>app</title></head>
    <body>
      <div id=app></div>
      <script src='app.js?cachebust=${cachebust}'></script>
    </body>
    </html>
  `
}