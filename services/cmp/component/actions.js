import { ADD_MSG } from ':constants'

export function setMsg(msg) {
  return {
    type: ADD_MSG,
    payload: { msg }
  }
} 