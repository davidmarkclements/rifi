'use strict'

import React from ':react'
import { connect } from 'react-redux'
import RemoteChildComponent from ':child-cmp'
import styled from 'styled-components'
import { setMsg  } from './actions'

const Wrapper = styled.div `
  border: 1px solid blue;
  margin: 0 auto;
  width: 40%;
  padding: 1em;
  padding-bottom: 2em;
  margin-top: 1em;
  text-align: center; 
`

const Control = styled.div `
  margin-top: 1em;
  zoom: 1.4;
`

const Button = styled.button `
  background: white;
  border: 1px solid silver;
  border-radius: 4px;
  padding-bottom: 2px;
  margin-top: -1px;
  margin-left: 2px;
`

function Component (props) {
  const { msgs } = props
  let input

  return (
    <Wrapper>
      <h1> :cmp </h1>
      <RemoteChildComponent msgs={msgs}/>
      <Control>
        <input ref={ (inp) => (inp && (input = inp)) }/> 
        <Button onClick={ (e)=> { 
          props.dispatch(setMsg(input.value)) 
          input.value = ''
        }}>add</Button>
      </Control>
    </Wrapper>
  )
}


export default connect(({msgs}) => ({msgs}))(Component)