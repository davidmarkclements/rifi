'use strict'

import React from ':react'
import styled from 'styled-components'
import dt from 'date-time'

const Wrapper = styled.div`
  border: 1px solid green;
  margin: 0 auto;
  padding: 1em;
  padding-bottom: 2em;
  margin-top: 1em; 
`

const Message = styled.div`
  text-align: left;
`

module.exports = ChildComponent

function ChildComponent (props) {
  const { msgs = [] } = props
  return (
    <Wrapper>
      <h2> :child-cmp </h2>
      <Message>
        { msgs.map((msg) => (<p> <span> { dt() }: </span> {msg} </p>)) }
      </Message>
    </Wrapper>
  )
}
