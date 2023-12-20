import React from 'react'
import { Provider } from 'react-redux'
import { createStore } from '@reduxjs/toolkit'
import * as Reducers from '@cfReducers'
import WorkflowGridMenu from './components/WorkflowGridMenu.js'

/****************************************
 *
 * ****************************************/
class WorkflowGrid extends React.Component {
  constructor(props) {
    super(props)
    // this.props.initial_data = data.props.data_package
    this.store = createStore(Reducers.gridMenuReducer, this.props.data_package) // is this supposde to be this.initial_data  ?
  }

  render() {
    this.container = container

    return (
      <Provider store={this.store}>
        <WorkflowGridMenu />
      </Provider>
    )
  }
}

export default WorkflowGrid
