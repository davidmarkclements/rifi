import { ADD_MSG } from ':constants'

const initialState = { msgs: [] }

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case ADD_MSG: state.msgs.push(action.payload.msg)
                  return { msgs: [...state.msgs] }  
    default: return state
  }
}