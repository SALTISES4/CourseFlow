import React from 'react'
import { Provider } from 'react-redux'
import { Store, createStore, AnyAction } from '@reduxjs/toolkit'
import WorkflowGridMenu from './components/WorkflowGridMenu'
import gridMenuReducer from '@cfRedux/reducers/gridMenu'

/****************************************
 *
 * ****************************************/

type PropsType = {
  data_package: any
}

class WorkflowGrid extends React.Component<PropsType> {
  private store: Store<any, AnyAction>
  constructor(props: PropsType) {
    super(props)
    // this.props.initial_data = data.props.data_package
    this.store = createStore(gridMenuReducer, this.props.data_package) // is this supposde to be this.initial_data  ?
  }

  render() {
    // this.container = @todo container not defined

    return (
      <Provider store={this.store}>
        <WorkflowGridMenu />
      </Provider>
    )
  }
}

export default WorkflowGrid
