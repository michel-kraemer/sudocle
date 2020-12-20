import Grid from "../components/Grid"
import Pad from "../components/Pad"
import StatusBar from "../components/StatusBar"
import { eqCell } from "../components/lib/utils"
import { TYPE_DIGITS, TYPE_SELECTION, ACTION_SET, ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE } from "../components/lib/Actions"
import { useReducer } from "react"
import Head from "next/head"
import styles from "./index.scss"

function digitsReducer(state, action, selection) {
  switch (action.action) {
    case ACTION_SET: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data)), {
          data: sc,
          digit: action.digit
        }]
      }
      return newState
    }

    case ACTION_REMOVE: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data))]
      }
      return newState
    }
  }
  return state
}

function selectionReducer(state, action) {
  switch (action.action) {
    case ACTION_CLEAR:
      return []
    case ACTION_SET:
      return [action.data]
    case ACTION_PUSH:
      return [...state, action.data]
    case ACTION_REMOVE:
      return [...state.filter(c => !eqCell(c, action.data))]
  }
  return state
}

function gameReducer(state, action) {
  switch (action.type) {
    case TYPE_DIGITS:
      return {
        ...state,
        digits: digitsReducer(state.digits, action, state.selection)
      }

    case TYPE_SELECTION:
      return {
        ...state,
        selection: selectionReducer(state.selection, action)
      }
  }
  return state
}

const Index = () => {
  const [game, updateGame] = useReducer(gameReducer, {
    digits: [],
    selection: []
  })

  function clearSelection() {
    updateGame({
      type: TYPE_SELECTION,
      action: ACTION_CLEAR
    })
  }

  return (<>
    <Head>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
      <meta name="description" content="Sudoku"/>
      <meta name="robots" content="index,follow"/>
      <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet"/>
      <title>Sudoku</title>
    </Head>
    <StatusBar />
    <div className="game-container" onClick={clearSelection}>
      <div className="grid-container">
        <Grid game={game} updateGame={updateGame} />
      </div>
      <Pad updateGame={updateGame} />
      <style jsx>{styles}</style>
    </div>
  </>)
}

export default Index
