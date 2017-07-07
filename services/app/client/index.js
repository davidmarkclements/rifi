'use strict'
import mockProcess from './lib/mock-process'
import React from 'react'
import ReactDOM from 'react-dom'
import RemoteComponent from ':cmp'

const App = () => <RemoteComponent msg="Hello World"/>

ReactDOM.render(
  <App />,
  document.getElementById('app')
)
