'use strict'

const render = String.raw

const cachebust = 'ah'

module.exports = html

function html (state = {msg: 'hello'}) {
  return render`
    <html>
    <head><title>app</title></head>
    <body>
      <div id=app></div>
      <script src='app.js?cachebust=${cachebust}'></script>
    </body>
    </html>
  `
}
